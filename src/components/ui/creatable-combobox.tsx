import * as React from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
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

export interface ComboboxItem {
  value: string;
  label: string;
  metadata?: string;
}

interface CreatableComboboxProps {
  items: ComboboxItem[];
  value: string;
  onValueChange: (value: string) => void;
  onCreateNew?: (inputValue: string) => Promise<string | void>;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  createText?: (input: string) => string;
  loading?: boolean;
  disabled?: boolean;
}

export function CreatableCombobox({
  items,
  value,
  onValueChange,
  onCreateNew,
  placeholder = "Select item...",
  searchPlaceholder = "Search...",
  emptyText = "No items found.",
  createText = (input) => `Create "${input}"`,
  loading = false,
  disabled = false,
}: CreatableComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isCreating, setIsCreating] = React.useState(false);

  const selectedItem = items.find((item) => item.value === value);

  const filteredItems = React.useMemo(() => {
    if (!searchQuery) return items;
    
    const query = searchQuery.toLowerCase();
    return items.filter((item) =>
      item.label.toLowerCase().includes(query) ||
      item.metadata?.toLowerCase().includes(query)
    );
  }, [items, searchQuery]);

  const showCreateOption = 
    onCreateNew && 
    searchQuery.length > 0 && 
    !filteredItems.some(item => 
      item.label.toLowerCase() === searchQuery.toLowerCase()
    );

  const handleCreate = async () => {
    if (!onCreateNew) return;
    
    setIsCreating(true);
    try {
      const newId = await onCreateNew(searchQuery);
      if (newId) {
        onValueChange(newId);
      }
      setSearchQuery("");
      setOpen(false);
    } catch (error: any) {
      console.error("Failed to create:", error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled || loading}
        >
          <span className="truncate">
            {loading ? (
              "Loading..."
            ) : selectedItem ? (
              <div className="flex flex-col items-start">
                <span>{selectedItem.label}</span>
                {selectedItem.metadata && (
                  <span className="text-xs text-muted-foreground">
                    {selectedItem.metadata}
                  </span>
                )}
              </div>
            ) : (
              placeholder
            )}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {filteredItems.map((item) => (
                <CommandItem
                  key={item.value}
                  value={item.value}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue === value ? "" : currentValue);
                    setOpen(false);
                    setSearchQuery("");
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === item.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{item.label}</span>
                    {item.metadata && (
                      <span className="text-xs text-muted-foreground">
                        {item.metadata}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
              
              {showCreateOption && (
                <CommandItem
                  value={`__create__${searchQuery}`}
                  onSelect={handleCreate}
                  disabled={isCreating}
                  className="text-primary"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {isCreating ? "Creating..." : createText(searchQuery)}
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
