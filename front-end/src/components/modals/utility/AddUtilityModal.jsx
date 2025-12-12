import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

// Schema validation
const utilitySchema = z.object({
  name: z.string().min(1, "Tên tiện ích không được để trống"),
});

export default function AddUtilityModal({ isOpen, onClose, onAddSuccess }) {
  const form = useForm({
    resolver: zodResolver(utilitySchema),
    defaultValues: {
      name: "",
    },
  });

  const onSubmit = (values) => {
    onAddSuccess(values.name);
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px] bg-white text-black p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold mb-4">Thêm tiện ích</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tiện ích</FormLabel>
                  <FormControl>
                    <Input placeholder="Wifi, BBQ..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-between pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Hủy
              </Button>
              <Button type="submit" className="bg-black text-white hover:bg-gray-800">
                Chấp nhận
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}