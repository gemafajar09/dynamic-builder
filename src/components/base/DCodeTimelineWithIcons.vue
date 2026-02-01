<script setup lang="ts">
import { breakpointsTailwind, useBreakpoints } from "@vueuse/core"
import { computed, ref } from "vue"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

// lucide icons (udah ada di package kamu)
import {
  ArrowRight,
  Clock,
  Cpu,
  CpuIcon,
  FileText,
  Globe,
  Link as LinkIcon,
  MapPin,
  MessageSquare,
  Pencil,
  Phone,
  Plane,
  RefreshCcw,
  Server,
  Share2,
  ShoppingCart,
  User,
} from "lucide-vue-next"

const breakpoints = useBreakpoints(breakpointsTailwind)
const isSm = breakpoints.smaller("md")

const serverSwitch = ref(false)

// ✅ data timeline TANPA gambar (imgUrl optional)
type TimelineItem =
  | {
    type: "flight"
    title: string
    meta: string
    from: string
    to: string
    time: string
    fileName?: string
    fileIcon?: "pdf" | "file"
  }
  | {
    type: "interview"
    title: string
    meta: string
    desc: string
    personName: string
    personRole: string
    avatarUrl?: string // optional, kalau ada baru tampil
  }
  | {
    type: "product"
    title: string
    meta: string
    desc: string
    customer: string
    price: string
    qty: string
    imgUrl?: string // optional
  }
  | {
    type: "design"
    title: string
    meta: string
    desc: string
    personName: string
    avatarUrl?: string // optional
  }
  | {
    type: "server"
    title: string
    chipText: string
    ip: string
    cpu: string
    memory: string
  }
  | {
    type: "location"
    title: string
    chipText: string
    desc1: string
    desc2?: string
    due: string
  }

const items = computed<TimelineItem[]>(() => [
  {
    type: "flight",
    title: "Get on the flight",
    meta: "Wednesday",
    from: "Charles de Gaulle Airport, Paris",
    to: "Heathrow Airport, London",
    time: "6:30 AM",
    fileName: "booking-card.pdf",
    fileIcon: "pdf",
  },
  {
    type: "interview",
    title: "Interview Schedule",
    meta: "April, 18",
    desc:
      "Lorem ipsum, dolor sit amet consectetur adipisicing elit. Possimus quos, voluptates voluptas rem veniam expedita.",
    personName: "Rebecca Godman",
    personRole: "Javascript Developer",
    // avatarUrl: "https://..." // kalau ada, isi aja
  },
  {
    type: "product",
    title: "Sold Puma POPX Blue Color",
    meta: "January, 10",
    desc:
      "PUMA presents the latest shoes from its collection. Light & comfortable made with highly durable material.",
    customer: "Micheal Scott",
    price: "$375.00",
    qty: "1",
    // imgUrl: "https://..." // optional
  },
  {
    type: "design",
    title: "Design Review",
    meta: "September, 20",
    desc: "Weekly review of freshly prepared design for our new application.",
    personName: "John Doe (Client)",
    // avatarUrl: "https://..." // optional
  },
  {
    type: "server",
    title: "Ubuntu Server",
    chipText: "Inactive",
    ip: "192.654.8.566",
    cpu: "4 Cores",
    memory: "2 GB",
  },
  {
    type: "location",
    title: "Location",
    chipText: "High",
    desc1: "Find location for the company celebration.",
    desc2: "Lorem ipsum, dolor sit amet consectetur adipisicing elit.",
    due: "15th Jan",
  },
])

const iconMeta = (t: TimelineItem["type"]) => {
  switch (t) {
    case "flight":
      return { Icon: Plane, ring: "bg-primary/10 text-primary border-primary/30" }
    case "interview":
      return { Icon: Clock, ring: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" }
    case "product":
      return { Icon: ShoppingCart, ring: "bg-amber-500/10 text-amber-600 border-amber-500/30" }
    case "design":
      return { Icon: Pencil, ring: "bg-sky-500/10 text-sky-600 border-sky-500/30" }
    case "server":
      return { Icon: Server, ring: "bg-rose-500/10 text-rose-600 border-rose-500/30" }
    case "location":
      return { Icon: MapPin, ring: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" }
  }
}

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("")
</script>

<template>
  <Card class="border-none shadow-none">
    <CardHeader class="px-0">
      <CardTitle class="text-lg font-medium">Timeline With Icons</CardTitle>
    </CardHeader>

    <CardContent class="px-0">
      <div class="relative">
        <!-- vertical line -->
        <div class="absolute left-4 top-0 h-full w-px bg-border" />

        <div class="space-y-6">
          <div v-for="(it, idx) in items" :key="idx" class="relative pl-14">
            <!-- icon -->
            <div class="absolute left-0 top-2 flex h-8 w-8 items-center justify-center rounded-full border"
              :class="iconMeta(it.type).ring">
              <component :is="iconMeta(it.type).Icon" class="h-4 w-4" />
            </div>

            <!-- content card -->
            <Card class="rounded-xl">
              <CardContent class="p-4">
                <!-- FLIGHT -->
                <template v-if="it.type === 'flight'">
                  <div class="flex items-center justify-between gap-3">
                    <p class="font-medium">{{ it.title }}</p>
                    <p class="text-xs text-muted-foreground">{{ it.meta }}</p>
                  </div>

                  <p class="mt-1 text-sm text-muted-foreground">
                    <span class="text-foreground">{{ it.from }}</span>
                    <ArrowRight class="mx-2 inline h-4 w-4" />
                    <span class="text-foreground">{{ it.to }}</span>
                  </p>

                  <p class="mt-1 text-xs text-muted-foreground">{{ it.time }}</p>

                  <div v-if="it.fileName" class="mt-3 flex items-center gap-2 text-sm">
                    <FileText class="h-4 w-4 text-muted-foreground" />
                    <span>{{ it.fileName }}</span>
                  </div>
                </template>

                <!-- INTERVIEW -->
                <template v-else-if="it.type === 'interview'">
                  <div class="flex items-center justify-between gap-3">
                    <p class="font-medium">{{ it.title }}</p>
                    <p class="text-xs text-muted-foreground">{{ it.meta }}</p>
                  </div>

                  <p class="mt-2 text-sm text-muted-foreground">{{ it.desc }}</p>

                  <Separator class="my-4" />

                  <div class="flex flex-wrap items-center justify-between gap-3">
                    <div class="flex items-center gap-3">
                      <Avatar class="h-10 w-10">
                        <AvatarImage v-if="it.avatarUrl" :src="it.avatarUrl" />
                        <AvatarFallback>{{ initials(it.personName) }}</AvatarFallback>
                      </Avatar>

                      <div class="leading-tight">
                        <p class="text-sm font-medium">{{ it.personName }}</p>
                        <p class="text-xs text-muted-foreground">{{ it.personRole }}</p>
                      </div>
                    </div>

                    <div class="flex items-center gap-2">
                      <Button size="icon" variant="ghost">
                        <MessageSquare class="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost">
                        <Phone class="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </template>

                <!-- PRODUCT -->
                <template v-else-if="it.type === 'product'">
                  <div class="flex flex-col gap-3 sm:flex-row sm:items-start">
                    <!-- image optional -->
                    <div class="h-16 w-16 shrink-0 rounded-lg bg-muted flex items-center justify-center">
                      <img v-if="it.imgUrl" :src="it.imgUrl" class="h-full w-full rounded-lg object-cover"
                        alt="product" />
                      <ShoppingCart v-else class="h-5 w-5 text-muted-foreground" />
                    </div>

                    <div class="flex-1">
                      <div class="flex items-center justify-between gap-3">
                        <p class="font-medium">{{ it.title }}</p>
                        <p class="text-xs text-muted-foreground">{{ it.meta }}</p>
                      </div>

                      <p class="mt-1 text-sm text-muted-foreground">{{ it.desc }}</p>

                      <div class="mt-4 grid gap-3" :class="isSm ? 'grid-cols-1' : 'grid-cols-3'">
                        <div class="text-left sm:text-center">
                          <p class="text-sm font-medium">Customer</p>
                          <p class="text-xs text-muted-foreground">{{ it.customer }}</p>
                        </div>
                        <div class="text-left sm:text-center">
                          <p class="text-sm font-medium">Price</p>
                          <p class="text-xs text-muted-foreground">{{ it.price }}</p>
                        </div>
                        <div class="text-left sm:text-center">
                          <p class="text-sm font-medium">Quantity</p>
                          <p class="text-xs text-muted-foreground">{{ it.qty }}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </template>

                <!-- DESIGN -->
                <template v-else-if="it.type === 'design'">
                  <div class="flex items-center justify-between gap-3">
                    <p class="font-medium">{{ it.title }}</p>
                    <p class="text-xs text-muted-foreground">{{ it.meta }}</p>
                  </div>

                  <p class="mt-2 text-sm text-muted-foreground">{{ it.desc }}</p>

                  <div class="mt-3 flex items-center gap-3">
                    <Avatar class="h-10 w-10">
                      <AvatarImage v-if="it.avatarUrl" :src="it.avatarUrl" />
                      <AvatarFallback>{{ initials(it.personName) }}</AvatarFallback>
                    </Avatar>

                    <p class="text-sm font-medium">{{ it.personName }}</p>
                  </div>
                </template>

                <!-- SERVER -->
                <template v-else-if="it.type === 'server'">
                  <div class="flex items-start justify-between gap-3">
                    <p class="font-medium">{{ it.title }}</p>
                    <Badge variant="destructive" class="h-6">{{ it.chipText }}</Badge>
                  </div>

                  <div class="mt-3 grid gap-2 text-sm">
                    <div class="flex items-center justify-between gap-3">
                      <div class="flex items-center gap-2 text-muted-foreground">
                        <Globe class="h-4 w-4" />
                        <span>IP Address</span>
                      </div>
                      <span class="font-medium">{{ it.ip }}</span>
                    </div>

                    <div class="flex items-center justify-between gap-3">
                      <div class="flex items-center gap-2 text-muted-foreground">
                        <Cpu class="h-4 w-4" />
                        <span>CPU</span>
                      </div>
                      <span class="font-medium">{{ it.cpu }}</span>
                    </div>

                    <div class="flex items-center justify-between gap-3">
                      <div class="flex items-center gap-2 text-muted-foreground">
                        <CpuIcon class="h-4 w-4" />
                        <span>Memory</span>
                      </div>
                      <span class="font-medium">{{ it.memory }}</span>
                    </div>
                  </div>

                  <Separator class="my-4" />

                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <Button size="icon" variant="ghost">
                        <Share2 class="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost">
                        <RefreshCcw class="h-4 w-4" />
                      </Button>
                    </div>

                    <!-- <Switch v-model:checked="serverSwitch" /> -->
                  </div>
                </template>

                <!-- LOCATION -->
                <template v-else-if="it.type === 'location'">
                  <div class="flex items-start justify-between gap-3">
                    <div class="flex items-center gap-2">
                      <MapPin class="h-4 w-4 text-muted-foreground" />
                      <p class="font-medium">{{ it.title }}</p>
                    </div>

                    <Badge variant="destructive" class="h-6">{{ it.chipText }}</Badge>
                  </div>

                  <p class="mt-2 text-sm text-muted-foreground">{{ it.desc1 }}</p>
                  <p v-if="it.desc2" class="mt-1 text-sm text-muted-foreground">{{ it.desc2 }}</p>

                  <Separator class="my-4" />

                  <div class="flex flex-wrap items-center justify-between gap-3">
                    <div class="flex items-center gap-2">
                      <Button size="icon" variant="ghost">
                        <LinkIcon class="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost">
                        <MessageSquare class="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost">
                        <User class="h-4 w-4" />
                      </Button>
                    </div>

                    <p class="text-xs text-muted-foreground">Due date: {{ it.due }}</p>
                  </div>
                </template>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
