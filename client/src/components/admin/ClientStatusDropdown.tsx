import React from "react";
import { 
  Select,
  SelectContent, 
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

// Client-side status values (what the client table expects)
export const CLIENT_STATUS = {
  ACTIVE: 'active',
  PENDING: 'pending',
  INACTIVE: 'inactive'
};

// Database license status values (what the backend uses)
export const LICENSE_STATUS = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  SUSPENDED: 'suspended'
};

// Mapping between client status and license status
export const mapClientStatusToLicenseStatus = (clientStatus: string): string => {
  switch (clientStatus) {
    case CLIENT_STATUS.ACTIVE:
      return LICENSE_STATUS.ACTIVE;
    case CLIENT_STATUS.PENDING:
      return LICENSE_STATUS.ACTIVE; // Pending maps to active (trial is now a plan type, not status)
    case CLIENT_STATUS.INACTIVE:
      return LICENSE_STATUS.EXPIRED;
    default:
      return LICENSE_STATUS.ACTIVE;
  }
};

// Mapping between license status and client status
export const mapLicenseStatusToClientStatus = (licenseStatus: string): string => {
  switch (licenseStatus) {
    case LICENSE_STATUS.ACTIVE:
      return CLIENT_STATUS.ACTIVE;
    case LICENSE_STATUS.EXPIRED:
    case LICENSE_STATUS.SUSPENDED:
      return CLIENT_STATUS.INACTIVE;
    default:
      return CLIENT_STATUS.ACTIVE;
  }
};

interface ClientStatusDropdownProps {
  value: string;
  onChange: (value: string) => void;
}

export const ClientStatusDropdown = ({ value, onChange }: ClientStatusDropdownProps) => {
  return (
    <Select 
      value={value} 
      onValueChange={onChange}
    >
      <SelectTrigger>
        <SelectValue placeholder="Select status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={CLIENT_STATUS.ACTIVE}>Active</SelectItem>
        <SelectItem value={CLIENT_STATUS.PENDING}>Pending</SelectItem>
        <SelectItem value={CLIENT_STATUS.INACTIVE}>Inactive</SelectItem>
      </SelectContent>
    </Select>
  );
};

export default ClientStatusDropdown;