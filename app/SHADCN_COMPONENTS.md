# Shadcn UI Komponenten - AutoLabel

Alle Shadcn UI Komponenten sind erfolgreich in die AutoLabel Electron-App integriert.

## Installierte Komponenten

### ✅ Button
**Pfad:** `@/components/ui/button`

**Features:**
- Variants: `default`, `outline`, `secondary`, `ghost`, `destructive`, `link`
- Sizes: `default`, `sm`, `lg`, `icon`, `icon-sm`, `icon-lg`

**Usage:**
```tsx
import { Button } from "@/components/ui/button"
import { Info } from "lucide-react"

// Outline Button
<Button variant="outline">Scannen</Button>

// Icon Button (Info bei Email Accounts)
<Button variant="outline" size="icon">
  <Info />
</Button>

// Mit Spinner für lange Prozesse
import { Spinner } from "@/components/ui/spinner"
<Button disabled>
  <Spinner />
  Scanne Emails...
</Button>
```

---

### ✅ Card
**Pfad:** `@/components/ui/card`

**Usage:**
```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"

<Card>
  <CardHeader>
    <CardTitle>Email Account</CardTitle>
    <CardDescription>IMAP Konfiguration</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
  <CardFooter>
    {/* Footer Actions */}
  </CardFooter>
</Card>
```

---

### ✅ Badge
**Pfad:** `@/components/ui/badge`

**Variants:** `default`, `secondary`, `destructive`, `outline`

**Usage:**
```tsx
import { Badge } from "@/components/ui/badge"

<Badge>Gescannt</Badge>
<Badge variant="secondary">Vorbereitet</Badge>
<Badge variant="destructive">Fehler</Badge>
```

---

### ✅ Checkbox
**Pfad:** `@/components/ui/checkbox`

**Usage:**
```tsx
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

<div className="flex items-center space-x-2">
  <Checkbox id="sale-1" />
  <Label htmlFor="sale-1">Sale auswählen</Label>
</div>
```

---

### ✅ Data Table
**Pfad:** `@/components/ui/data-table` & `@/components/ui/table`

**Benötigt:** `@tanstack/react-table` (✅ installiert)

**Usage:**
```tsx
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"

type EmailAccount = {
  id: string
  email: string
  provider: string
  status: string
}

const columns: ColumnDef<EmailAccount>[] = [
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "provider",
    header: "Provider",
  },
  {
    accessorKey: "status",
    header: "Status",
  },
]

<DataTable columns={columns} data={emailAccounts} />
```

---

### ✅ Dropdown Menu
**Pfad:** `@/components/ui/dropdown-menu`

**Usage:**
```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">Filter</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>Vinted</DropdownMenuItem>
    <DropdownMenuItem>Andere</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

### ✅ Empty State
**Pfad:** `@/components/ui/empty`

**Usage:**
```tsx
import { Empty, EmptyIcon, EmptyTitle, EmptyDescription, EmptyAction } from "@/components/ui/empty"
import { Mail } from "lucide-react"
import { Button } from "@/components/ui/button"

<Empty>
  <EmptyIcon>
    <Mail className="h-6 w-6 text-muted-foreground" />
  </EmptyIcon>
  <EmptyTitle>Noch keine Mails gescannt</EmptyTitle>
  <EmptyDescription>
    Klicke auf "Scannen" um deine Emails nach Labels zu durchsuchen.
  </EmptyDescription>
  <EmptyAction>
    <Button>Jetzt scannen</Button>
  </EmptyAction>
</Empty>
```

---

### ✅ Field
**Pfad:** `@/components/ui/field`

**Usage:**
```tsx
import { Field, FieldLabel, FieldDescription, FieldMessage } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

<Field>
  <FieldLabel htmlFor="imap-server">IMAP Server</FieldLabel>
  <Input id="imap-server" placeholder="imap.gmail.com" />
  <FieldDescription>
    Der IMAP Server deines Email-Anbieters
  </FieldDescription>
  <FieldMessage>Fehler: Server nicht erreichbar</FieldMessage>
</Field>
```

---

### ✅ Input OTP
**Pfad:** `@/components/ui/input-otp`

**Benötigt:** `input-otp` (✅ installiert)

**Usage:**
```tsx
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp"

<InputOTP maxLength={16}>
  <InputOTPGroup>
    <InputOTPSlot index={0} />
    <InputOTPSlot index={1} />
    <InputOTPSlot index={2} />
    <InputOTPSlot index={3} />
  </InputOTPGroup>
  <InputOTPSeparator />
  <InputOTPGroup>
    <InputOTPSlot index={4} />
    <InputOTPSlot index={5} />
    <InputOTPSlot index={6} />
    <InputOTPSlot index={7} />
  </InputOTPGroup>
  {/* ... weitere Gruppen für 16-stelliges App-Passwort */}
</InputOTP>
```

---

### ✅ Menubar
**Pfad:** `@/components/ui/menubar`

**Usage:**
```tsx
import {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
} from "@/components/ui/menubar"

<Menubar>
  <MenubarMenu>
    <MenubarTrigger>Sales</MenubarTrigger>
    <MenubarContent>
      <MenubarItem>Alle anzeigen</MenubarItem>
      <MenubarItem>Heute</MenubarItem>
    </MenubarContent>
  </MenubarMenu>
  <MenubarMenu>
    <MenubarTrigger>Prepare</MenubarTrigger>
    <MenubarContent>
      <MenubarItem>Labels vorbereiten</MenubarItem>
    </MenubarContent>
  </MenubarMenu>
  <MenubarMenu>
    <MenubarTrigger>Print Queue</MenubarTrigger>
  </MenubarMenu>
</Menubar>
```

---

### ✅ Pagination
**Pfad:** `@/components/ui/pagination`

**Usage:**
```tsx
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination"

<Pagination>
  <PaginationContent>
    <PaginationItem>
      <PaginationPrevious href="#" />
    </PaginationItem>
    <PaginationItem>
      <PaginationLink href="#" isActive>1</PaginationLink>
    </PaginationItem>
    <PaginationItem>
      <PaginationLink href="#">2</PaginationLink>
    </PaginationItem>
    <PaginationItem>
      <PaginationEllipsis />
    </PaginationItem>
    <PaginationItem>
      <PaginationNext href="#" />
    </PaginationItem>
  </PaginationContent>
</Pagination>
```

---

### ✅ Progress
**Pfad:** `@/components/ui/progress`

**Usage:**
```tsx
import { Progress } from "@/components/ui/progress"

// Email Scan Fortschritt
<Progress value={60} />

// Label Vorbereitung
<div className="space-y-2">
  <div className="flex justify-between text-sm">
    <span>Labels werden vorbereitet...</span>
    <span>3/5</span>
  </div>
  <Progress value={60} />
</div>
```

---

### ✅ Separator
**Pfad:** `@/components/ui/separator`

**Usage:**
```tsx
import { Separator } from "@/components/ui/separator"

<div>
  <h3>Email Accounts</h3>
  <Separator className="my-4" />
  <p>Liste der verknüpften Accounts</p>
</div>
```

---

### ✅ Sidebar
**Pfad:** `@/components/ui/sidebar`

**Benötigt:** `@radix-ui/react-tooltip` (✅ installiert)

**Usage:**
```tsx
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarInset,
} from "@/components/ui/sidebar"
import { Mail } from "lucide-react"

<SidebarProvider>
  <Sidebar>
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>Email Accounts</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton>
                <Mail />
                <span>user@gmail.com</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
  </Sidebar>
  <SidebarInset>
    {/* Main Content */}
  </SidebarInset>
</SidebarProvider>
```

---

### ✅ Sonner (Toast)
**Pfad:** `@/components/ui/sonner`

**Benötigt:** `sonner` (✅ installiert)

**Setup in App.tsx:**
```tsx
import { Toaster } from "@/components/ui/sonner"

function App() {
  return (
    <>
      {/* Your app content */}
      <Toaster />
    </>
  )
}
```

**Usage:**
```tsx
import { toast } from "sonner"

// Erfolg
toast.success("Label erfolgreich gedruckt!")

// Fehler
toast.error("Drucker nicht gefunden")

// Promise (für Druck-Prozess)
toast.promise(
  printLabel(),
  {
    loading: "Drucke Label...",
    success: "Label erfolgreich gedruckt!",
    error: "Fehler beim Drucken",
  }
)

// Mit Action
toast("Label bereit", {
  action: {
    label: "Drucken",
    onClick: () => console.log("Print"),
  },
})
```

---

### ✅ Spinner
**Pfad:** `@/components/ui/spinner`

**Sizes:** `default`, `sm`, `lg`, `xl`

**Usage:**
```tsx
import { Spinner } from "@/components/ui/spinner"

// Standard
<Spinner />

// Klein (in Buttons)
<Spinner size="sm" />

// Groß (Fullscreen Loading)
<div className="flex items-center justify-center h-screen">
  <Spinner size="xl" />
</div>
```

---

## CSS Variablen

Alle Komponenten nutzen die CSS-Variablen aus `app/src/index.css`:

- `--primary`: Vinted Teal (#007782)
- `--background`, `--foreground`: Haupt-Farben
- `--card`, `--popover`: Container-Farben
- `--muted`, `--accent`: Sekundär-Farben
- `--destructive`: Fehler-Farben
- `--border`, `--input`: Border-Farben
- `--sidebar-*`: Sidebar-spezifische Farben
- `--radius`: Border-Radius (0.75rem)

## Tailwind Konfiguration

Die `app/tailwind.config.js` wurde erweitert mit:
- Sidebar-Colors
- Caret-Blink Animation (für Input OTP)
- Alle Shadcn-Standard-Farben

## Dependencies

Alle benötigten Dependencies sind installiert:
- ✅ `@tanstack/react-table` - für Data Table
- ✅ `input-otp` - für Input OTP
- ✅ `@radix-ui/react-tooltip` - für Sidebar Tooltips
- ✅ `sonner` - für Toast Notifications
- ✅ Alle anderen Radix UI Primitives

## TypeScript

Alle Komponenten sind vollständig typisiert und haben keine Linter-Fehler.

## Nächste Schritte

Die Komponenten können jetzt in den bestehenden Screens verwendet werden:
1. **ScanScreen**: Empty State, Progress, Spinner in Buttons
2. **HistoryScreen**: Data Table, Pagination, Badges
3. **PrepareScreen**: Card, Checkbox, Progress
4. **PrintScreen**: Sonner Toasts, Progress, Empty State

Die Navigation kann mit Menubar modernisiert werden, und Email Accounts können mit der Sidebar verwaltet werden.

