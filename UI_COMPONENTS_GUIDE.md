# UI Components Guide - TVU GDQP-AN Admin Portal

## 📋 Component Library Overview

Tôi đã tạo một bộ component tái sử dụng chuyên nghiệp cho hệ thống quản trị.

---

## 🎨 Components Created

### 1. Button Component
**File**: `frontend/src/components/Common/Button.tsx`

**Variants**:
- `primary` - Blue background (main actions)
- `secondary` - Gray background (secondary actions)
- `danger` - Red background (delete, logout)
- `success` - Green background (confirm)
- `ghost` - Transparent (subtle actions)

**Sizes**:
- `sm` - Small (px-3 py-1.5)
- `md` - Medium (px-4 py-2) - Default
- `lg` - Large (px-6 py-3)

**Props**:
- `variant`: Button style
- `size`: Button size
- `isLoading`: Show loading spinner
- `icon`: Icon element
- `fullWidth`: Stretch to full width
- `disabled`: Disable button

**Usage**:
```tsx
<Button variant="primary" size="lg" icon="📤" fullWidth>
  Upload Document
</Button>
```

---

### 2. Card Component
**File**: `frontend/src/components/Common/Card.tsx`

**Variants**:
- `default` - White with border
- `elevated` - White with shadow
- `outlined` - Transparent with border

**Padding**:
- `sm` - Small (p-3)
- `md` - Medium (p-6) - Default
- `lg` - Large (p-8)

**Usage**:
```tsx
<Card variant="elevated" padding="md">
  <h2>Card Title</h2>
  <p>Card content</p>
</Card>
```

---

### 3. Badge Component
**File**: `frontend/src/components/Common/Badge.tsx`

**Variants**:
- `primary` - Blue badge
- `success` - Green badge
- `warning` - Yellow badge
- `danger` - Red badge
- `info` - Cyan badge

**Sizes**:
- `sm` - Small (px-2 py-1)
- `md` - Medium (px-3 py-1.5) - Default

**Usage**:
```tsx
<Badge variant="success" size="md">
  ✓ Completed
</Badge>
```

---

### 4. Table Component
**File**: `frontend/src/components/Common/Table.tsx`

**Sub-components**:
- `Table` - Main table wrapper
- `TableHead` - Table header section
- `TableBody` - Table body section
- `TableRow` - Table row
- `TableHeader` - Header cell
- `TableCell` - Data cell

**Features**:
- Striped rows
- Hover effects
- Responsive overflow
- Rounded borders

**Usage**:
```tsx
<Table>
  <TableHead>
    <TableRow>
      <TableHeader>Name</TableHeader>
      <TableHeader>Status</TableHeader>
    </TableRow>
  </TableHead>
  <TableBody>
    <TableRow>
      <TableCell>John Doe</TableCell>
      <TableCell>Active</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

---

### 5. Input Component
**File**: `frontend/src/components/Common/Input.tsx`

**Props**:
- `label` - Input label
- `error` - Error message
- `helperText` - Helper text
- `icon` - Icon element
- `required` - Mark as required

**Features**:
- Label with required indicator
- Error state styling
- Helper text support
- Icon support
- Focus ring

**Usage**:
```tsx
<Input
  label="Email Address"
  placeholder="Enter email"
  error="Invalid email format"
  icon="📧"
  required
/>
```

---

### 6. Modal Component
**File**: `frontend/src/components/Common/Modal.tsx`

**Props**:
- `isOpen` - Show/hide modal
- `onClose` - Close callback
- `title` - Modal title
- `size` - Modal size (sm, md, lg, xl)
- `children` - Modal content

**Features**:
- Backdrop click to close
- Close button
- Smooth animations
- Responsive sizing

**Usage**:
```tsx
<Modal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  title="Confirm Action"
  size="md"
>
  <p>Are you sure?</p>
  <div className="flex gap-2 mt-4">
    <Button variant="secondary">Cancel</Button>
    <Button variant="primary">Confirm</Button>
  </div>
</Modal>
```

---

### 7. Alert Component
**File**: `frontend/src/components/Common/Alert.tsx`

**Variants**:
- `success` - Green alert (✓)
- `error` - Red alert (✕)
- `warning` - Yellow alert (⚠)
- `info` - Blue alert (ℹ)

**Props**:
- `variant` - Alert type
- `title` - Alert title
- `onClose` - Close callback
- `children` - Alert message

**Usage**:
```tsx
<Alert variant="warning" title="Attention">
  15 files have OCR errors and need to be reprocessed
</Alert>
```

---

## 🎨 Layout Components

### Sidebar Component
**File**: `frontend/src/components/Layout/Sidebar.tsx`

**Features**:
- Collapsible (w-64 → w-20)
- Gradient background
- Active state highlighting
- Badge support
- Smooth transitions
- Logout button

**Menu Items**:
- Dashboard
- Documents
- Data
- Decisions
- Reconciliation
- Reports
- Settings

---

### Header Component
**File**: `frontend/src/components/Layout/Header.tsx`

**Features**:
- Logo with gradient
- Search bar (hidden on mobile)
- Notification bell with badge
- User dropdown menu
- Sticky positioning
- Professional styling

**Dropdown Menu**:
- Profile
- Settings
- Help
- Logout

---

### MainLayout Component
**File**: `frontend/src/components/Layout/MainLayout.tsx`

**Structure**:
- Sidebar (left)
- Header (top)
- Main content (scrollable)
- Responsive grid

---

## 📄 Page Implementations

### Dashboard Page
**File**: `frontend/src/pages/Dashboard.tsx`

**Sections**:
- Metrics cards (4 cards)
- Status section
- Alerts section
- Progress bars
- Statistics

**Components Used**:
- Card
- Badge
- Alert
- Custom progress bars

---

### Documents Page
**File**: `frontend/src/pages/Documents.tsx`

**Sections**:
- Header with upload button
- Alert for errors
- Search & filter
- Document table
- Statistics cards

**Components Used**:
- Button
- Card
- Badge
- Table
- Input
- Alert

---

### Data Page
**File**: `frontend/src/pages/Data.tsx`

**Sections**:
- Header with export button
- Tab navigation
- Search & filter
- Student/Score table
- Statistics cards

**Components Used**:
- Button
- Card
- Badge
- Table
- Input

---

### Decisions Page
**File**: `frontend/src/pages/Decisions.tsx`

**Sections**:
- Header with add button
- Decision table
- Statistics cards
- Reconciliation modal

**Components Used**:
- Button
- Card
- Badge
- Table
- Modal

---

## 🎯 Design Tokens

### Colors
```
Primary: #2563eb (Blue)
Success: #10b981 (Green)
Warning: #f59e0b (Yellow)
Danger: #ef4444 (Red)
Info: #06b6d4 (Cyan)
Gray: #6b7280
```

### Spacing
```
xs: 4px
sm: 8px
md: 16px
lg: 24px
xl: 32px
2xl: 48px
```

### Border Radius
```
sm: 4px
md: 8px
lg: 12px
xl: 16px
full: 9999px
```

### Shadows
```
sm: 0 1px 2px rgba(0,0,0,0.05)
md: 0 4px 6px rgba(0,0,0,0.1)
lg: 0 10px 15px rgba(0,0,0,0.1)
xl: 0 20px 25px rgba(0,0,0,0.1)
```

---

## 🚀 Usage Patterns

### Form Pattern
```tsx
<Card>
  <div className="space-y-4">
    <Input label="Name" placeholder="Enter name" required />
    <Input label="Email" placeholder="Enter email" type="email" required />
    <div className="flex gap-2 pt-4">
      <Button variant="secondary" fullWidth>Cancel</Button>
      <Button variant="primary" fullWidth>Submit</Button>
    </div>
  </div>
</Card>
```

### Data Table Pattern
```tsx
<Card variant="elevated">
  <Table>
    <TableHead>
      <TableRow>
        <TableHeader>Column 1</TableHeader>
        <TableHeader>Column 2</TableHeader>
        <TableHeader>Status</TableHeader>
      </TableRow>
    </TableHead>
    <TableBody>
      {data.map(item => (
        <TableRow key={item.id}>
          <TableCell>{item.col1}</TableCell>
          <TableCell>{item.col2}</TableCell>
          <TableCell>
            <Badge variant="success">Active</Badge>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</Card>
```

### Alert Pattern
```tsx
<div className="space-y-4">
  <Alert variant="success" title="Success">
    Operation completed successfully
  </Alert>
  <Alert variant="warning" title="Warning">
    Please review before proceeding
  </Alert>
  <Alert variant="error" title="Error">
    Something went wrong
  </Alert>
</div>
```

---

## 📱 Responsive Behavior

### Mobile (< 640px)
- Single column layout
- Larger touch targets (44px+)
- Sidebar hidden (hamburger menu in Phase 2)
- Simplified tables

### Tablet (640px - 1024px)
- 2-3 column layout
- Sidebar visible
- Full tables

### Desktop (> 1024px)
- 3-4 column layout
- Full sidebar
- Complete tables

---

## ✅ Quality Checklist

- ✅ Consistent styling
- ✅ Reusable components
- ✅ Responsive design
- ✅ Accessible (ARIA labels, keyboard navigation)
- ✅ Professional appearance
- ✅ Smooth transitions
- ✅ Error handling
- ✅ Loading states

---

## 🎨 Next Steps

1. **Refresh browser** to see new design
2. **Test all pages** (Dashboard, Documents, Data, Decisions)
3. **Check responsive** on mobile/tablet
4. **Provide feedback** on design
5. **Phase 2**: Dark mode, animations, more components

---

**Status**: ✅ Professional UI Components Complete

