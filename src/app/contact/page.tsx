"use client";
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { Mail, MapPin, Phone, Github, Twitter, Linkedin } from "lucide-react";
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
import { Button } from "@/components/ui/button";

const formSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  message: z.string().min(10, "Message is too short"),
});

export default function ContactPage() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", email: "", subject: "", message: "" },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    console.log(data);
    alert("Message sent! (Mock)");
  };

  return (
    <main className="min-h-screen pt-24 pb-12 px-6 max-w-7xl mx-auto grid lg:grid-cols-2 gap-12">
      {/* Contact Info */}
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-black mb-4">
            Get in <span className="text-primary">Touch</span>
          </h1>
          <p className="text-muted-foreground">
            Have a question or want to collaborate? Drop us a message.
          </p>
        </div>

        <div className="space-y-4">
          <div className="glass p-4 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-xl text-primary">
              <Mail size={20} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Email Drop</p>
              <p className="font-bold text-sm">hello@diuscadi.org</p>
            </div>
          </div>
          <div className="glass p-4 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-xl text-primary">
              <MapPin size={20} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Location</p>
              <p className="font-bold text-sm">
                Innovation Hub, Block 4, Lagos
              </p>
            </div>
          </div>
        </div>

        {/* Map Placeholder */}
        <div className="glass h-64 rounded-3xl overflow-hidden relative grayscale">
          <div className="absolute inset-0 bg-primary/5 flex items-center justify-center">
            <p className="text-sm font-medium text-muted-foreground">
              Interactive Map Placeholder
            </p>
          </div>
        </div>

        {/* Socials */}
        <div className="flex gap-4">
          {[Github, Twitter, Linkedin].map((Icon, i) => (
            <Button
              key={i}
              variant="outline"
              size="icon"
              className="glass rounded-xl hover:text-primary"
            >
              <Icon size={18} />
            </Button>
          ))}
        </div>
      </div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="glass-heavy p-8 rounded-[2rem] border-t-4 border-t-primary"
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="John Doe"
                      className="glass"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="john@example.com"
                        className="glass"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Project Inquiry"
                        className="glass"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={5}
                      placeholder="How can we help?"
                      className="glass"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full h-12 font-bold text-lg">
              Send Message
            </Button>
          </form>
        </Form>
      </motion.div>
    </main>
  );
}
