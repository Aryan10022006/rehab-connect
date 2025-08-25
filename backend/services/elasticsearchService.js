// Elasticsearch Service for Advanced Search Capabilities
const { Client } = require('@elastic/elasticsearch');

class ElasticsearchService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.indexName = 'rehab_clinics';
    this.initializeElasticsearch();
  }

  async initializeElasticsearch() {
    try {
      // Initialize only if Elasticsearch URL is provided
      if (process.env.ELASTICSEARCH_URL) {
        this.client = new Client({
          node: process.env.ELASTICSEARCH_URL,
          auth: {
            username: process.env.ELASTICSEARCH_USERNAME || 'elastic',
            password: process.env.ELASTICSEARCH_PASSWORD || ''
          },
          tls: {
            rejectUnauthorized: false
          }
        });

        // Test connection
        await this.client.ping();
        this.isConnected = true;
        console.log('Elasticsearch connected successfully');

        // Create index if it doesn't exist
        await this.createIndex();
      } else {
        console.log('Elasticsearch not configured, skipping initialization');
      }
    } catch (error) {
      console.error('Elasticsearch initialization failed:', error.message);
      this.isConnected = false;
    }
  }

  async createIndex() {
    try {
      const indexExists = await this.client.indices.exists({ index: this.indexName });
      
      if (!indexExists) {
        await this.client.indices.create({
          index: this.indexName,
          body: {
            mappings: {
              properties: {
                name: {
                  type: 'text',
                  analyzer: 'standard',
                  fields: {
                    keyword: { type: 'keyword' },
                    suggest: {
                      type: 'completion',
                      analyzer: 'simple'
                    }
                  }
                },
                address: {
                  type: 'text',
                  analyzer: 'standard'
                },
                pincode: { type: 'keyword' },
                location: { type: 'geo_point' },
                rating: { type: 'float' },
                verified: { type: 'boolean' },
                status: { type: 'keyword' },
                services: { type: 'keyword' },
                specializations: { type: 'keyword' },
                description: {
                  type: 'text',
                  analyzer: 'standard'
                },
                phone: { type: 'keyword' },
                website: { type: 'keyword' },
                timings: { type: 'text' },
                createdAt: { type: 'date' },
                searchKeywords: { type: 'keyword' }
              }
            },
            settings: {
              analysis: {
                analyzer: {
                  clinic_analyzer: {
                    type: 'custom',
                    tokenizer: 'standard',
                    filter: ['lowercase', 'stop', 'stemmer']
                  }
                }
              }
            }
          }
        });
        console.log('Elasticsearch index created');
      }
    } catch (error) {
      console.error('Create index error:', error);
    }
  }

  // Index a clinic document
  async indexClinic(clinicId, clinicData) {
    if (!this.isConnected) return false;

    try {
      await this.client.index({
        index: this.indexName,
        id: clinicId,
        body: {
          ...clinicData,
          location: {
            lat: clinicData.lat,
            lon: clinicData.long
          },
          searchKeywords: this.generateSearchKeywords(clinicData)
        }
      });
      return true;
    } catch (error) {
      console.error('Index clinic error:', error);
      return false;
    }
  }

  // Bulk index multiple clinics
  async bulkIndexClinics(clinics) {
    if (!this.isConnected) return false;

    try {
      const body = clinics.flatMap(clinic => [
        { index: { _index: this.indexName, _id: clinic.id } },
        {
          ...clinic,
          location: {
            lat: clinic.lat,
            lon: clinic.long
          },
          searchKeywords: this.generateSearchKeywords(clinic)
        }
      ]);

      const response = await this.client.bulk({ refresh: true, body });
      
      if (response.errors) {
        console.error('Bulk index errors:', response.errors);
      }

      return !response.errors;
    } catch (error) {
      console.error('Bulk index error:', error);
      return false;
    }
  }

  // Advanced search with multiple parameters
  async advancedSearch({
    query = '',
    lat,
    lng,
    radius = 10,
    filters = {},
    sort = 'relevance',
    from = 0,
    size = 20
  }) {
    if (!this.isConnected) {
      throw new Error('Elasticsearch not available');
    }

    try {
      const searchBody = {
        from,
        size,
        query: {
          bool: {
            must: [],
            filter: [],
            should: []
          }
        },
        sort: [],
        highlight: {
          fields: {
            name: {},
            address: {},
            description: {}
          }
        }
      };

      // Text search
      if (query) {
        searchBody.query.bool.must.push({
          multi_match: {
            query,
            fields: [
              'name^3',
              'address^2',
              'description',
              'services',
              'specializations'
            ],
            type: 'best_fields',
            fuzziness: 'AUTO'
          }
        });
      } else {
        searchBody.query.bool.must.push({
          match_all: {}
        });
      }

      // Geographic search
      if (lat && lng) {
        searchBody.query.bool.filter.push({
          geo_distance: {
            distance: `${radius}km`,
            location: {
              lat: parseFloat(lat),
              lon: parseFloat(lng)
            }
          }
        });

        // Add distance sorting
        searchBody.sort.push({
          _geo_distance: {
            location: {
              lat: parseFloat(lat),
              lon: parseFloat(lng)
            },
            order: 'asc',
            unit: 'km',
            mode: 'min'
          }
        });
      }

      // Apply filters
      if (filters.verified !== undefined) {
        searchBody.query.bool.filter.push({
          term: { verified: filters.verified }
        });
      }

      if (filters.rating && filters.rating > 0) {
        searchBody.query.bool.filter.push({
          range: { rating: { gte: filters.rating } }
        });
      }

      if (filters.status) {
        searchBody.query.bool.filter.push({
          term: { status: filters.status }
        });
      }

      if (filters.services && filters.services.length > 0) {
        searchBody.query.bool.filter.push({
          terms: { services: filters.services }
        });
      }

      // Sorting
      if (sort === 'rating') {
        searchBody.sort.unshift({ rating: 'desc' });
      } else if (sort === 'name') {
        searchBody.sort.unshift({ 'name.keyword': 'asc' });
      }

      // Boost verified clinics
      searchBody.query.bool.should.push({
        term: { verified: { value: true, boost: 1.5 } }
      });

      const response = await this.client.search({
        index: this.indexName,
        body: searchBody
      });

      const results = response.hits.hits.map(hit => ({
        id: hit._id,
        ...hit._source,
        _score: hit._score,
        distance: hit.sort && hit.sort.length > 1 ? hit.sort[1] : undefined,
        highlights: hit.highlight
      }));

      return {
        clinics: results,
        total: response.hits.total.value,
        maxScore: response.hits.max_score
      };

    } catch (error) {
      console.error('Elasticsearch search error:', error);
      throw error;
    }
  }

  // Auto-complete suggestions
  async getSuggestions(query, size = 8) {
    if (!this.isConnected) return [];

    try {
      const response = await this.client.search({
        index: this.indexName,
        body: {
          suggest: {
            clinic_suggest: {
              prefix: query,
              completion: {
                field: 'name.suggest',
                size
              }
            }
          }
        }
      });

      return response.suggest.clinic_suggest[0].options.map(option => ({
        text: option.text,
        score: option._score
      }));

    } catch (error) {
      console.error('Suggestions error:', error);
      return [];
    }
  }

  // Aggregations for analytics
  async getSearchAnalytics() {
    if (!this.isConnected) return null;

    try {
      const response = await this.client.search({
        index: this.indexName,
        body: {
          size: 0,
          aggs: {
            by_city: {
              terms: { field: 'city.keyword', size: 10 }
            },
            by_rating: {
              histogram: { field: 'rating', interval: 0.5 }
            },
            verified_count: {
              terms: { field: 'verified' }
            },
            avg_rating: {
              avg: { field: 'rating' }
            }
          }
        }
      });

      return response.aggregations;

    } catch (error) {
      console.error('Analytics error:', error);
      return null;
    }
  }

  // Generate search keywords for better indexing
  generateSearchKeywords(clinic) {
    const keywords = new Set();
    
    if (clinic.name) {
      clinic.name.toLowerCase().split(' ').forEach(word => {
        if (word.length > 2) keywords.add(word);
      });
    }

    if (clinic.address) {
      clinic.address.toLowerCase().split(/[,\s]+/).forEach(word => {
        if (word.length > 2) keywords.add(word);
      });
    }

    if (clinic.services) {
      clinic.services.forEach(service => keywords.add(service.toLowerCase()));
    }

    if (clinic.pincode) {
      keywords.add(clinic.pincode);
    }

    return Array.from(keywords);
  }

  // Health check
  isHealthy() {
    return this.isConnected;
  }
}

module.exports = new ElasticsearchService();
