"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const countries = [
  { value: "us", label: "United States" },
  { value: "gb", label: "United Kingdom" },
  { value: "ca", label: "Canada" },
  { value: "au", label: "Australia" },
  { value: "de", label: "Germany" },
  { value: "fr", label: "France" },
  { value: "in", label: "India" },
  { value: "jp", label: "Japan" },
  { value: "br", label: "Brazil" },
  { value: "za", label: "South Africa" },
  { value: "ng", label: "Nigeria" },
  { value: "cn", label: "China" },
  { value: "sg", label: "Singapore" },
  { value: "ae", label: "United Arab Emirates" },
  { value: "sa", label: "Saudi Arabia" },
  { value: "mx", label: "Mexico" },
  { value: "ar", label: "Argentina" },
  { value: "eg", label: "Egypt" },
  { value: "ke", label: "Kenya" },
  { value: "nz", label: "New Zealand" },
  { value: "it", label: "Italy" },
  { value: "es", label: "Spain" },
  { value: "nl", label: "Netherlands" },
  { value: "se", label: "Sweden" },
  { value: "no", label: "Norway" },
  { value: "ch", label: "Switzerland" },
  { value: "pk", label: "Pakistan" },
  { value: "bd", label: "Bangladesh" },
  { value: "gh", label: "Ghana" },
  { value: "ph", label: "Philippines" },
];

interface CountryComboboxProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function CountryCombobox({
  value,
  onChange,
  placeholder = "Select country...",
  className,
}: CountryComboboxProps) {
  const [open, setOpen] = React.useState(false);

  const selected = countries.find((c) => c.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between font-normal text-sm h-10",
              !value && "text-muted-foreground",
              className
            )}
          >
            {selected ? selected.label : placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        }
      />
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Search country..." className="h-9" />
          <CommandList>
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup>
              {countries.map((country) => (
                <CommandItem
                  key={country.value}
                  value={country.label}
                  onSelect={() => {
                    onChange?.(country.value === value ? "" : country.value);
                    setOpen(false);
                  }}
                >
                  {country.label}
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      value === country.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
