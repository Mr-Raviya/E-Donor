# E-Donor Admin Panel Setup

This document provides instructions for setting up and using the E-Donor admin panel.

## Admin Credentials

**Email:** admin@gmail.com  
**Password:** admin

## Installation

1. Install the dependencies:
```bash
npm install
```

Or with yarn:
```bash
yarn install
```

2. Start the development server:
```bash
npm start
```

## Admin Panel Features

### 1. Admin Authentication
- Secure login system with email and password
- Session management using AsyncStorage
- Beautiful gradient-based login UI

### 2. Admin Dashboard
- Overview of all admin modules
- Quick stats display (total users, active requests)
- Easy navigation to all management sections

### 3. User Management
- View all registered users
- Add new users with blood type selection
- Activate/Deactivate user accounts
- Delete users
- Search and filter users by status
- View user details including donation count

### 4. Hospital Management
- Add and manage hospitals
- Verify/Unverify hospital status
- Track hospital capacity and availability
- View hospital ratings
- Delete hospitals
- Search hospitals by name or address

### 5. Blood Inventory Management
- Track blood stock levels by blood type
- Update inventory (add/remove units)
- View expiring blood units
- Monitor reserved blood units
- Low stock alerts and status indicators
- Quick update actions

### 6. Blood Request Management
- View all blood donation requests
- Filter by status (pending, approved, fulfilled, rejected)
- Approve or reject requests
- Mark requests as fulfilled
- View detailed request information
- Urgency indicators (critical, urgent, normal)

### 7. Notification Management
- Send notifications to users
- Pre-built notification templates
- Target specific user groups (all, donors, recipients, specific)
- Different notification types (general, urgent, reminder, event)
- View notification history
- Track notification read rates

### 8. Admin Settings
- Configure notification preferences
- System settings (auto-approve, maintenance mode)
- Two-factor authentication toggle
- Data management (export, backup, clear cache)
- App version and build information
- Secure logout functionality

## Accessing the Admin Panel

1. Launch the app
2. On the welcome screen, tap the "Admin Portal" button at the bottom
3. Enter the admin credentials:
   - Email: admin@gmail.com
   - Password: admin
4. You'll be redirected to the admin dashboard

## Navigation

From the dashboard, you can access any module by tapping its card:
- **User Management** - Manage app users
- **Hospital Management** - Manage hospitals
- **Blood Inventory** - Track blood stock
- **Blood Requests** - Handle blood requests
- **Notifications** - Send notifications
- **Settings** - Configure admin settings

## Design Features

- Modern gradient-based UI
- Smooth animations and transitions
- Intuitive navigation
- Responsive layout
- Clear visual indicators for status
- Comprehensive search and filter options
- Modal-based forms for adding/editing data

## Security Notes

⚠️ **Important for Production:**
- The current implementation uses hardcoded credentials for demonstration
- In production, implement proper backend authentication
- Use secure token-based authentication (JWT)
- Store credentials securely in environment variables
- Implement rate limiting and brute force protection
- Add two-factor authentication
- Use HTTPS for all API calls

## Customization

You can customize the admin panel by:
1. Modifying colors in the styles (look for color values like `#DC143C`)
2. Adjusting layouts in the StyleSheet objects
3. Adding new admin features by creating new screens
4. Updating navigation in `_layout.tsx`

## Troubleshooting

If you encounter issues:
1. Clear the cache: `npm start -- --clear`
2. Reinstall dependencies: `rm -rf node_modules && npm install`
3. Check console for error messages
4. Ensure AsyncStorage is properly installed

## Future Enhancements

Potential improvements:
- Real-time data updates
- Advanced analytics and reports
- Export data in various formats (PDF, Excel)
- Role-based access control
- Activity logs and audit trail
- Push notification integration
- Advanced search with multiple filters
- Bulk operations for user management
- Calendar view for blood donation events
- Integration with backend API

---

For questions or support, please contact the development team.
