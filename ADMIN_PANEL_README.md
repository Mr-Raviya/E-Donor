# E-Donor Admin Panel Setup

This document provides instructions for setting up and using the E-Donor admin panel.

## Admin Credentials

**Email:** admin@gmail.com  
**Password:** admin

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```
2. Provide Firebase credentials in `.env` (see root `README.md` for the exact variables).
3. Start Expo:
   ```bash
   npx expo start
   ```

> ℹ️ The admin UI still uses mocked data locally. When you are ready to persist admin actions, connect each module to Firestore or Cloud Functions using the Firebase helpers in `lib/firebase.ts`.

## Backend Integration Checklist

| Module              | Suggested Firebase Collection |
|---------------------|--------------------------------|
| User Management     | `profiles`, `admins`           |
| Hospital Management | `hospitals`                    |
| Inventory           | `blood_inventory`              |
| Requests            | `donation_requests`            |
| Notifications       | `notifications` + Cloud Functions |

Create collections with similar field names (snake_case) so the current mock data maps easily once you replace the in-memory arrays.

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
- The admin credentials are hardcoded for demos; wire them to Firebase Auth or a custom auth service before releasing.
- Lock Firestore with rules that restrict each collection to the correct roles (e.g., only admins can mutate `donation_requests`).
- Store secrets in `.env` or a secrets manager (never in source control).
- Add rate limiting, two-factor auth, and HTTPS for every API call.

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
