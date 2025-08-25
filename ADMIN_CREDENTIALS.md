# RehabConnect Admin Credentials

## Default Admin Account

**IMPORTANT**: Run the admin setup script first to create the admin user.

```bash
cd backend
node scripts/createAdmin.js
```

## Admin Credentials

- **Email**: admin@rehabconnect.com
- **Password**: RehabAdmin2025!
- **Username**: admin
- **Role**: Super Admin

## Admin Panel Access

- **URL**: http://localhost:3000/admin
- **Login**: Use the credentials above

## Admin Permissions

The admin account has full control over:

- ✅ **User Management**: View, edit, delete, block users
- ✅ **Clinic Management**: Add, edit, delete clinics via CSV upload or manual entry
- ✅ **Review Management**: View, moderate, delete reviews
- ✅ **Analytics**: System statistics and performance metrics
- ✅ **System Control**: Database operations and configuration

## Security Notes

⚠️ **IMPORTANT SECURITY MEASURES**:

1. **Change Default Password**: After first login, immediately change the password
2. **Restrict Access**: Admin panel should only be accessible from secure networks
3. **Enable HTTPS**: Use HTTPS in production
4. **Regular Backups**: Ensure regular database backups
5. **Audit Logs**: Monitor admin activities

## Production Setup

For production deployment:

1. Use environment variables for admin credentials
2. Enable multi-factor authentication
3. Set up proper logging and monitoring
4. Use strong, unique passwords
5. Restrict admin panel access by IP

## Support

For admin-related issues:
- Check server logs for detailed error information
- Ensure Firebase configuration is correct
- Verify admin user exists in Firebase Auth and Firestore
