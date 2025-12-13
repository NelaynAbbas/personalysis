import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Eye, Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

// Invoice form interface
interface InvoiceFormData {
  companyId: number;
  subscriptionId: number | null;
  invoiceNumber: string;
  amount: number;
  currency: string;
  tax: number | null;
  status: string;
  dueDate: string;
  items: {
    description: string;
    quantity: number;
    price: number;
    total: number;
  }[];
  notes: string | null;
}

// Item form interface
interface InvoiceItem {
  description: string;
  quantity: number;
  price: number;
}

const BillingManagement = () => {
  const generateInvoiceNumber = () => `INV-${format(new Date(), 'yyyyMMdd-HHmmss')}`;
  // State for dialog
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  
  // State for form
  const [invoiceData, setInvoiceData] = useState<InvoiceFormData>({
    companyId: 0,
    subscriptionId: null,
    invoiceNumber: generateInvoiceNumber(),
    amount: 0,
    currency: "USD",
    tax: 0,
    status: "draft",
    dueDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"), // 30 days from now
    items: [],
    notes: null
  });
  
  // State for current invoice item being added
  const [currentItem, setCurrentItem] = useState<InvoiceItem>({
    description: "",
    quantity: 1,
    price: 0,
  });
  
  // Fetch companies for dropdown
  const { 
    data: companiesData,
    isLoading: isLoadingCompanies
  } = useQuery<any>({
    queryKey: ['/api/clients'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  const clients = companiesData?.data || [];
  
  // Fetch invoices for list view
  const { data: invoicesData, isLoading: isLoadingInvoices } = useQuery<any>({
    queryKey: ["/api/invoices"],
  });
  const invoices = invoicesData?.data || [];

  // State for view/edit dialogs
  const [viewInvoice, setViewInvoice] = useState<any | null>(null);
  const [editStatusInvoice, setEditStatusInvoice] = useState<any | null>(null);
  const [editStatusValue, setEditStatusValue] = useState<string>("paid");
  // Search and filter like Support tab
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Normalize invoice helper (handle snake_case from API)
  const getCompanyId = (inv: any) => inv.companyId ?? inv.company_id;
  const getDueDate = (inv: any) => inv.dueDate ?? inv.due_date;
  const getPaidDate = (inv: any) => inv.paidDate ?? inv.paid_date;
  const getInvoiceNumber = (inv: any) => inv.invoiceNumber ?? inv.invoice_number;
  const getSubscriptionId = (inv: any) => inv.subscriptionId ?? inv.subscription_id;

  const getClientLabel = (companyId: number) => {
    const c = clients.find((x: any) => x.id === companyId);
    if (!c) return `Company #${companyId}`;
    // Prefer name; fallback to company; avoid duplicate "Name (Name)"
    const label = c.name || c.company || `Company #${companyId}`;
    return label;
  };

  const filteredInvoices = invoices.filter((inv: any) => {
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    const companyId = getCompanyId(inv);
    const invoiceNum = String(getInvoiceNumber(inv) || '').toLowerCase();
    const clientLabel = String(getClientLabel(companyId) || '').toLowerCase();
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = query ? (invoiceNum.includes(query) || clientLabel.includes(query)) : true;
    return matchesStatus && matchesSearch;
  });

  // Pagination like Support tab
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const total = filteredInvoices.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, pageCount);
  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, total);
  const pagedInvoices = filteredInvoices.slice(startIdx, endIdx);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-gray-200 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Handle changing form fields
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setInvoiceData({
      ...invoiceData,
      [name]: value,
    });
  };
  
  // Handle changing select fields
  const handleSelectChange = (name: string, value: string) => {
    setInvoiceData({
      ...invoiceData,
      [name]: name === "companyId" ? parseInt(value) : value,
    });
  };
  
  // Handle changing current item fields
  const handleItemChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentItem({
      ...currentItem,
      [name]: name === "description" ? value : parseFloat(value),
    });
  };
  
  // Add item to invoice
  const handleAddItem = () => {
    if (!currentItem.description || currentItem.price <= 0) {
      toast({
        title: "Invalid item",
        description: "Please provide a description and a valid price",
        variant: "destructive",
      });
      return;
    }
    
    const newItem = {
      ...currentItem,
      total: currentItem.price * currentItem.quantity,
    };
    
    const newItems = [...invoiceData.items, newItem];
    const newTotal = newItems.reduce((sum, item) => sum + item.total, 0);
    
    setInvoiceData({
      ...invoiceData,
      items: newItems,
      amount: newTotal,
    });
    
    // Reset current item
    setCurrentItem({
      description: "",
      quantity: 1,
      price: 0,
    });
  };
  
  // Remove item from invoice
  const handleRemoveItem = (index: number) => {
    const newItems = invoiceData.items.filter((_, i) => i !== index);
    const newTotal = newItems.reduce((sum, item) => sum + item.total, 0);
    
    setInvoiceData({
      ...invoiceData,
      items: newItems,
      amount: newTotal,
    });
  };
  
  // Create invoice
  const handleCreateInvoice = async () => {
    try {
      if (invoiceData.companyId <= 0) {
        toast({
          title: "Company required",
          description: "Please select a client company for this invoice",
          variant: "destructive",
        });
        return;
      }
      
      if (invoiceData.items.length === 0) {
        toast({
          title: "No items",
          description: "Please add at least one item to the invoice",
          variant: "destructive",
        });
        return;
      }
      
      // Create the invoice
      await api.post("/api/invoices", {
        ...invoiceData,
        items: JSON.stringify(invoiceData.items),
        tax: invoiceData.tax || 0,
      });
      
      toast({
        title: "Invoice created",
        description: "The invoice has been created successfully",
      });
      
      // Reset form and close dialog
      setInvoiceData({
        companyId: 0,
        subscriptionId: null,
        invoiceNumber: generateInvoiceNumber(),
        amount: 0,
        currency: "USD",
        tax: 0,
        status: "draft",
        dueDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"), // 30 days from now
        items: [],
        notes: null
      });
      setShowCreateInvoice(false);
      
      // Refetch invoices
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      
    } catch (error) {
      console.error("Error creating invoice:", error);
      toast({
        title: "Error",
        description: "Failed to create invoice. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Change invoice status
  const handleChangeStatus = async (invoiceId: number, status: string) => {
    await api.patch(`/api/invoices/${invoiceId}/status`, { status });
    queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
  };

  // Mark as paid (record payment)
  const handleMarkAsPaid = async (invoiceId: number) => {
    await api.post(`/api/invoices/${invoiceId}/pay`, {});
    queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <CardTitle className="text-xl font-bold">Billing Management</CardTitle>
              <CardDescription>
                Manage invoices, payments, and subscription billing
              </CardDescription>
            </div>
            <div>
              <Button onClick={() => setShowCreateInvoice(true)}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Create Invoice
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative w-full md:w-64">
                <Input 
                  placeholder="Search invoices..." 
                  className="pl-8" 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-2 top-2.5 text-muted-foreground">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.3-4.3"></path>
                </svg>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex h-10 w-full md:w-44 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="all">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Paid Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingInvoices ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">Loading invoices…</TableCell>
                  </TableRow>
                ) : filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">No invoices found.</TableCell>
                  </TableRow>
                ) : (
                  pagedInvoices.map((inv: any) => {
                    const client = clients.find((c: any) => c.id === getCompanyId(inv));
                    const amount = ((inv.amount || 0) + (inv.tax || 0)) / 100;
                    return (
                      <TableRow key={inv.id}>
                        <TableCell className="font-medium">{getInvoiceNumber(inv)}</TableCell>
                        <TableCell>{getClientLabel(getCompanyId(inv))}</TableCell>
                        <TableCell>${amount.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge className={getStatusBadge(inv.status)}>
                            {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>{getDueDate(inv) ? format(new Date(getDueDate(inv)), 'yyyy-MM-dd') : '-'}</TableCell>
                        <TableCell>{getPaidDate(inv) ? format(new Date(getPaidDate(inv)), 'yyyy-MM-dd') : '-'}</TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button variant="ghost" size="icon" title="View" onClick={() => setViewInvoice(inv)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="Change Status" onClick={() => { setEditStatusInvoice(inv); setEditStatusValue(inv.status); }}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing <strong>{total === 0 ? 0 : startIdx + 1}-{endIdx}</strong> of <strong>{total}</strong> invoices
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled={currentPage >= pageCount} onClick={() => setPage((p) => Math.min(pageCount, p + 1))}>
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Create Invoice Dialog */}
      <Dialog open={showCreateInvoice} onOpenChange={setShowCreateInvoice}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Invoice</DialogTitle>
            <DialogDescription>
              Create a new invoice for a client. Add items and specify payment details.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="invoiceNumber" className="text-right">
                Invoice # <span className="text-red-500">*</span>
              </Label>
              <Input
                id="invoiceNumber"
                name="invoiceNumber"
                value={invoiceData.invoiceNumber}
                readOnly
                aria-readonly="true"
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="company" className="text-right">
                Client <span className="text-red-500">*</span>
              </Label>
              <div className="col-span-3">
                <Select 
                  onValueChange={(value) => handleSelectChange("companyId", value)}
                  defaultValue={invoiceData.companyId.toString()}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Select a client</SelectItem>
                    {clients.map((client: any) => (
                      <SelectItem key={client.id} value={client.id.toString()}>
                        {client.company} ({client.name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dueDate" className="text-right">
                Due Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="dueDate"
                name="dueDate"
                type="date"
                value={invoiceData.dueDate}
                onChange={handleChange}
                className="col-span-3"
                required
                aria-required="true"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status <span className="text-red-500">*</span>
              </Label>
              <div className="col-span-3">
                <Select 
                  onValueChange={(value) => handleSelectChange("status", value)}
                  defaultValue={invoiceData.status}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="currency" className="text-right">
                Currency
              </Label>
              <div className="col-span-3">
                <Select 
                  onValueChange={(value) => handleSelectChange("currency", value)}
                  defaultValue={invoiceData.currency}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="JPY">JPY</SelectItem>
                    <SelectItem value="CAD">CAD</SelectItem>
                    <SelectItem value="AUD">AUD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Add items section */}
            <div className="mt-6 border-t pt-4">
              <h3 className="text-md font-medium mb-3">Invoice Items <span className="text-red-500">*</span></h3>
              
              {/* Display existing items */}
              {invoiceData.items.length > 0 && (
                <div className="mb-4">
                  <div className="grid grid-cols-12 font-semibold text-sm mb-2">
                    <div className="col-span-5">Description</div>
                    <div className="col-span-2">Qty</div>
                    <div className="col-span-2">Price</div>
                    <div className="col-span-2">Total</div>
                    <div className="col-span-1"></div>
                  </div>
                  
                  {invoiceData.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 text-sm py-2 border-b">
                      <div className="col-span-5">{item.description}</div>
                      <div className="col-span-2">{item.quantity}</div>
                      <div className="col-span-2">${item.price.toFixed(2)}</div>
                      <div className="col-span-2">${item.total.toFixed(2)}</div>
                      <div className="col-span-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleRemoveItem(index)}
                          className="h-6 w-6 p-0"
                        >
                          ✕
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  <div className="grid grid-cols-12 font-semibold text-sm mt-2">
                    <div className="col-span-9 text-right pr-4">Total:</div>
                    <div className="col-span-2">${invoiceData.amount.toFixed(2)}</div>
                    <div className="col-span-1"></div>
                  </div>
                </div>
              )}
              
              {/* Add new item form */}
              <div className="grid grid-cols-12 gap-2 items-start mb-2">
                <div className="col-span-5">
                  <Label htmlFor="item-description">
                    Item Description <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="item-description"
                    placeholder="e.g., Annual subscription — Professional plan"
                    name="description"
                    value={currentItem.description}
                    onChange={handleItemChange}
                    required
                    aria-required="true"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="item-quantity">
                    Quantity <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="item-quantity"
                    type="number"
                    min="1"
                    placeholder="1"
                    name="quantity"
                    value={currentItem.quantity.toString()}
                    onChange={handleItemChange}
                    required
                    aria-required="true"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="item-price">
                    Price <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="item-price"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    name="price"
                    value={currentItem.price.toString()}
                    onChange={handleItemChange}
                    required
                    aria-required="true"
                  />
                </div>
                <div className="col-span-3 flex items-end">
                  <Button onClick={handleAddItem} size="sm" className="w-full">
                    Add Item
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tax" className="text-right">
                Tax (%)
              </Label>
              <Input
                id="tax"
                name="tax"
                type="number"
                min="0"
                step="0.01"
                value={invoiceData.tax?.toString() || "0"}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Notes
              </Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Additional notes for the invoice"
                value={invoiceData.notes || ""}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateInvoice(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateInvoice}>
              Create Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Invoice Dialog */}
      <Dialog open={!!viewInvoice} onOpenChange={(o) => !o && setViewInvoice(null)}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Invoice {viewInvoice ? getInvoiceNumber(viewInvoice) : ''}</DialogTitle>
            {viewInvoice && (
              <div className="flex items-center gap-3 mt-1">
                <Badge className={getStatusBadge(viewInvoice.status)}>
                  {viewInvoice.status.charAt(0).toUpperCase() + viewInvoice.status.slice(1)}
                </Badge>
                <span className="text-sm text-muted-foreground">Due: {getDueDate(viewInvoice) ? format(new Date(getDueDate(viewInvoice)), 'yyyy-MM-dd') : '-'}</span>
              </div>
            )}
          </DialogHeader>
          {viewInvoice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Client</div>
                  <div className="font-medium">{getClientLabel(getCompanyId(viewInvoice))}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Subscription ID</div>
                  <div className="font-medium">{getSubscriptionId(viewInvoice) ?? '-'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Currency</div>
                  <div className="font-medium">{viewInvoice.currency}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Paid Date</div>
                  <div className="font-medium">{getPaidDate(viewInvoice) ? format(new Date(getPaidDate(viewInvoice)), 'yyyy-MM-dd') : '-'}</div>
                </div>
              </div>
              <div>
                <div className="text-sm font-semibold mb-2">Items</div>
                <div className="grid grid-cols-12 font-semibold text-xs mb-1">
                  <div className="col-span-7">Description</div>
                  <div className="col-span-2">Qty</div>
                  <div className="col-span-3">Price</div>
                </div>
                {(Array.isArray(viewInvoice.items) ? viewInvoice.items : []).map((it: any, idx: number) => (
                  <div key={idx} className="grid grid-cols-12 text-sm py-1 border-b">
                    <div className="col-span-7">{it.description}</div>
                    <div className="col-span-2">{it.quantity}</div>
                    <div className="col-span-3">${Number(it.price || 0).toFixed(2)}</div>
                  </div>
                ))}
                <div className="grid grid-cols-12 font-semibold text-sm mt-2">
                  <div className="col-span-9 text-right pr-4">Total:</div>
                  <div className="col-span-3">
                    ${(((viewInvoice.amount || 0) + (viewInvoice.tax || 0)) / 100).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewInvoice(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Status Dialog */}
      <Dialog open={!!editStatusInvoice} onOpenChange={(o) => !o && setEditStatusInvoice(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Edit Invoice Status</DialogTitle>
            <DialogDescription>Update the status of this invoice.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Status</Label>
            <div className="col-span-3">
              <Select onValueChange={(v) => setEditStatusValue(v)} defaultValue={editStatusValue}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditStatusInvoice(null)}>Cancel</Button>
            <Button onClick={async () => {
              if (editStatusInvoice) {
                await handleChangeStatus(editStatusInvoice.id, editStatusValue);
                setEditStatusInvoice(null);
              }
            }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BillingManagement;