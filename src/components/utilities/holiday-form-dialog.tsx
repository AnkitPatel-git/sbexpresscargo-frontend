"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  optionLabelForSelect,
  STATUS_ACTIVE_INACTIVE_OPTIONS,
} from "@/lib/select-closed-label";
import { holidayService } from "@/services/utilities/holiday-service";
import type { Holiday } from "@/types/utilities/holiday";

const schema = z.object({
  holidayDate: z.string().min(1, "Date is required"),
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().max(500).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

type FormValues = z.infer<typeof schema>;

function toDateInputValue(iso: string): string {
  return iso.split("T")[0] ?? iso;
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  holiday?: Holiday | null;
  onSaved: () => void;
};

export function HolidayFormDialog({
  open,
  onOpenChange,
  holiday,
  onSaved,
}: Props) {
  const isEdit = holiday != null;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      holidayDate: "",
      name: "",
      description: "",
      status: "ACTIVE",
    },
  });

  useEffect(() => {
    if (!open) return;
    if (holiday) {
      form.reset({
        holidayDate: toDateInputValue(holiday.holidayDate),
        name: holiday.name,
        description: holiday.description ?? "",
        status: holiday.status,
      });
    } else {
      form.reset({
        holidayDate: "",
        name: "",
        description: "",
        status: "ACTIVE",
      });
    }
  }, [open, holiday, form]);

  async function onSubmit(values: FormValues) {
    try {
      const payload = {
        holidayDate: values.holidayDate,
        name: values.name.trim(),
        description: values.description?.trim() || undefined,
        status: values.status,
      };
      if (isEdit && holiday) {
        await holidayService.updateHoliday(holiday.id, payload);
        toast.success("Holiday updated");
      } else {
        await holidayService.createHoliday(payload);
        toast.success("Holiday created");
      }
      onOpenChange(false);
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit holiday" : "Add holiday"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="holidayDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date (IST calendar day)</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Republic Day" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue>
                          {optionLabelForSelect(
                            field.value,
                            STATUS_ACTIVE_INACTIVE_OPTIONS,
                          )}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {STATUS_ACTIVE_INACTIVE_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {isEdit ? "Save" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
