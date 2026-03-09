# TVU GDQP-AN Admin Portal - Design System

## 🎨 Professional UI/UX Design

Tôi đã thiết kế một giao diện chuyên nghiệp, hiện đại cho hệ thống quản trị với các đặc điểm sau:

---

## 📐 Design Principles

1. **Minimalist & Professional** - Giao diện sạch, tập trung vào dữ liệu
2. **Consistent** - Sử dụng design system thống nhất
3. **Accessible** - Hỗ trợ keyboard navigation, ARIA labels
4. **Responsive** - Hoạt động tốt trên desktop, tablet, mobile
5. **Dark-aware** - Sẵn sàng cho dark mode (Phase 2)

---

## 🎯 Color Palette

### Primary Colors
- **Blue**: `#2563eb` - Primary actions, links
- **Gray**: `#1f2937` - Text, backgrounds
- **White**: `#ffffff` - Cards, backgrounds

### Status Colors
- **Success**: `#10b981` - Completed, success
- **Warning**: `#f59e0b` - Processing, pending
- **Danger**: `#ef4444` - Error, failed
- **Info**: `#06b6d4` - Information

### Gradients
- **Sidebar**: `from-slate-900 to-slate-800`
- **Logo**: `from-blue-400 to-blue-600`

---

## 🧩 Component Library

### 1. Button Component
```tsx
<Button variant="primary" size="md" icon="📤">
  Upload
</Button>
```

**Variants**: primary, secondary, danger, success, ghost  
**Sizes**: sm, md, lg  
**Features**: Loading state, icon support, full width

### 2. Card Component
```tsx
<Card variant="elevated" padding="md">
  Content here
</Card>
```

**Variants**: default, elevated, outlined  
**Padding**: sm, md, lg

### 3. Badge Component
```tsx
<Badge variant="success" size="md">
  Completed
</Badge>
```

**Variants**: primary, success, warning, danger, info  
**Sizes**: sm, md

### 4. Table Component
```tsx
<Table>
  <TableHead>
    <TableRow>
      <TableHeader>Column</TableHeader>
    </TableRow>
  </TableHead>
  <TableBody>
    <TableRow>
      <TableCell>Data</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

**Features**: Striped rows, hover effects, responsive

### 5. Input Component
```tsx
<Input
  label="Email"
  placeholder="Enter email"
  error="Invalid email"
  icon="📧"
/>
```

**Features**: Label, error message, helper text, icon support

### 6. Modal Component
```tsx
<Modal isOpen={true} onClose={handleClose} title="Title" size="lg">
  Content here
</Modal>
```

**Sizes**: sm, md, lg, xl

### 7. Alert Component
```tsx
<Alert variant="warning" title="Warning">
  This is a warning message
</Alert>
```

**Variants**: success, error, warning, info

---

## 🎨 Layout Components

### Sidebar
- **Features**:
  - Collapsible (w-64 → w-20)
  - Gradient background (slate-900 to slate-800)
  - Active state highlighting
  - Badge support for notifications
  - Smooth transitions

### Header
- **Features**:
  - Logo with gradient
  - Search bar (hidden on mobile)
  - Notification bell with badge
  - User dropdown menu
  - Sticky positioning

### Main Layout
- **Structure**:
  - Sidebar (left)
  - Header (top)
  - Main content (scrollable)
  - Responsive grid

---

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

### Grid System
- **1 column**: Mobile
- **2 columns**: Tablet
- **3-4 columns**: Desktop

---

## 🎭 Page Designs

### 1. Dashboard
- **Metrics Cards**: 4 cards with icons and colors
- **Status Section**: Status items with badges
- **Alerts Section**: Alert messages
- **Progress Bars**: Visual progress indicators
- **Stats**: Summary statistics

### 2. Documents Management
- **Search & Filter**: Input + select dropdown
- **Table**: Document list with status badges
- **Actions**: View, Edit buttons
- **Stats**: Summary cards

### 3. Data Management
- **Tabs**: Students / Scores
- **Search & Filter**: Advanced filtering
- **Table**: Data list with actions
- **Stats**: Summary statistics

### 4. Decisions Management
- **Table**: Decision list with reconciliation status
- **Progress Bars**: Match rate visualization
- **Modal**: Reconciliation details
- **Stats**: Summary statistics

---

## 🎨 Typography

### Font Family
- **Primary**: System fonts (Segoe UI, Roboto, etc.)
- **Fallback**: sans-serif

### Font Sizes
- **H1**: 30px (3xl) - Page titles
- **H2**: 24px (2xl) - Section titles
- **H3**: 20px (xl) - Subsection titles
- **Body**: 16px (base) - Regular text
- **Small**: 14px (sm) - Secondary text
- **Tiny**: 12px (xs) - Labels, badges

### Font Weights
- **Bold**: 700 - Headings
- **Semibold**: 600 - Subheadings
- **Medium**: 500 - Labels
- **Regular**: 400 - Body text

---

## 🎯 Spacing System

### Padding/Margin Scale
- **xs**: 4px (0.25rem)
- **sm**: 8px (0.5rem)
- **md**: 16px (1rem)
- **lg**: 24px (1.5rem)
- **xl**: 32px (2rem)
- **2xl**: 48px (3rem)

---

## 🔄 Interactions

### Hover Effects
- Buttons: Darker background
- Links: Color change
- Cards: Shadow increase
- Rows: Background highlight

### Focus States
- Inputs: Blue ring (2px)
- Buttons: Outline visible
- Links: Underline

### Loading States
- Buttons: Spinner icon + disabled
- Tables: Skeleton loading
- Cards: Pulse animation

### Transitions
- Duration: 200ms
- Easing: ease-in-out
- Properties: colors, shadows, transforms

---

## 📊 Data Visualization

### Colors for Data
- **Blue**: Primary data
- **Green**: Success/Positive
- **Yellow**: Warning/Pending
- **Red**: Error/Negative
- **Purple**: Secondary data

### Progress Bars
- **Height**: 8px
- **Border Radius**: Full
- **Colors**: Blue, Green, Purple

### Badges
- **Padding**: 8px 12px (sm), 12px 16px (md)
- **Border Radius**: Full (rounded-full)
- **Font Size**: 12px (xs), 14px (sm)

---

## 🎨 Dark Mode (Phase 2)

### Color Adjustments
- **Background**: Dark gray (#1f2937)
- **Text**: Light gray (#f3f4f6)
- **Cards**: Dark gray (#111827)
- **Borders**: Dark gray (#374151)

---

## 📦 Component Files

```
frontend/src/components/
├── Common/
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Badge.tsx
│   ├── Table.tsx
│   ├── Input.tsx
│   ├── Modal.tsx
│   └── Alert.tsx
└── Layout/
    ├── MainLayout.tsx
    ├── Sidebar.tsx
    └── Header.tsx
```

---

## 🚀 Usage Examples

### Button
```tsx
<Button variant="primary" size="lg" icon="📤" fullWidth>
  Upload Document
</Button>
```

### Card with Table
```tsx
<Card variant="elevated">
  <Table>
    {/* Table content */}
  </Table>
</Card>
```

### Alert
```tsx
<Alert variant="warning" title="Attention">
  15 files have OCR errors
</Alert>
```

### Modal
```tsx
<Modal isOpen={true} onClose={handleClose} title="Reconcile">
  <div className="space-y-4">
    {/* Modal content */}
  </div>
</Modal>
```

---

## 🎯 Best Practices

1. **Consistency**: Use components from library
2. **Spacing**: Use spacing scale (4px, 8px, 16px, etc.)
3. **Colors**: Use defined color palette
4. **Typography**: Use defined font sizes
5. **Responsive**: Test on mobile, tablet, desktop
6. **Accessibility**: Add labels, ARIA attributes
7. **Performance**: Lazy load images, optimize bundles

---

## 📱 Mobile Optimization

- **Touch targets**: Minimum 44px
- **Spacing**: Increased on mobile
- **Fonts**: Larger on mobile
- **Columns**: Single column on mobile
- **Navigation**: Hamburger menu (Phase 2)

---

## 🔍 Quality Checklist

- ✅ Consistent spacing
- ✅ Proper color usage
- ✅ Clear typography hierarchy
- ✅ Responsive design
- ✅ Accessible components
- ✅ Smooth transitions
- ✅ Professional appearance
- ✅ User-friendly interactions

---

## 📚 Design Resources

- **Tailwind CSS**: https://tailwindcss.com
- **Color Palette**: https://tailwindcss.com/docs/customizing-colors
- **Typography**: https://tailwindcss.com/docs/font-size
- **Spacing**: https://tailwindcss.com/docs/padding

---

**Status**: ✅ Professional Design System Complete

