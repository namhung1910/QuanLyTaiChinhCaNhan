# CSS Structure

This project now uses component-specific CSS files instead of a single global CSS file.

## File Structure

### Common Styles
- `src/styles/common.css` - Shared styles used across multiple components
  - Container layouts
  - Grid systems
  - Form elements (input, select, button)
  - List styles
  - Utility classes (scroll, warn)

### Component-Specific Styles
- `src/components/NavBar.css` - Navigation bar styles
- `src/pages/Auth.css` - Authentication pages (login/register) styles
- `src/pages/DanhMuc.css` - Category management page styles
- `src/pages/GiaoDich.css` - Transaction management page styles
- `src/pages/NganSach.css` - Budget management page styles
- `src/pages/BaoCao.css` - Report page styles

## Benefits

1. **Better Organization**: Each component has its own CSS file
2. **Easier Maintenance**: Changes to one component don't affect others
3. **Reduced Conflicts**: No more CSS class name conflicts
4. **Better Performance**: Only load CSS for components that are used
5. **Cleaner Code**: Easier to find and modify styles

## Migration Notes

- `App.css` has been deprecated and contains only documentation
- All styles have been moved to appropriate component files
- Common styles are imported in `App.jsx`
- Component-specific styles are imported in their respective component files
