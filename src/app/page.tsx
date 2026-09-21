import {
  BriefcaseBusinessIcon,
  ChevronRightIcon,
  FileTextIcon,
  MoreHorizontalIcon,
  PlusIcon,
  SearchIcon,
  SettingsIcon,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const jobs = [
  {
    role: "Senior Product Designer",
    detail: "San Francisco, CA · Full-time",
    status: "Published",
    candidates: 24,
    updated: "2 days ago",
    owner: "Jamie Lee",
    initials: "JL",
  },
  {
    role: "Frontend Engineer",
    detail: "Remote · Full-time",
    status: "Draft",
    candidates: 0,
    updated: "6 days ago",
    owner: "Marcus Kim",
    initials: "MK",
  },
  {
    role: "Growth Marketing Lead",
    detail: "New York, NY · Full-time",
    status: "Published",
    candidates: 17,
    updated: "4 days ago",
    owner: "Taylor Singh",
    initials: "TS",
  },
  {
    role: "Data Analyst",
    detail: "Remote · Full-time",
    status: "Closed",
    candidates: 38,
    updated: "11 days ago",
    owner: "Priya Raman",
    initials: "PR",
  },
] as const;

function BrandMark() {
  return (
    <span aria-hidden="true" className="relative block size-7">
      <span className="absolute top-0 right-0 size-4 rounded-md bg-primary/70" />
      <span className="absolute bottom-0 left-0 size-4 rounded-md bg-primary" />
    </span>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="hidden border-r bg-surface lg:flex lg:flex-col">
        <div className="flex h-24 items-center gap-3 px-7">
          <BrandMark />
          <span className="text-xl font-semibold tracking-tight">Jev Match</span>
        </div>

        <nav aria-label="Main navigation" className="flex flex-col gap-1 px-3">
          <a
            aria-current="page"
            className="flex h-12 items-center gap-3 rounded-lg border-l-2 border-primary bg-primary-soft px-4 text-sm font-medium text-primary"
            href="#"
          >
            <BriefcaseBusinessIcon aria-hidden="true" />
            Jobs
          </a>
          <a
            className="flex h-12 items-center gap-3 rounded-lg px-4 text-sm font-medium text-secondary-foreground hover:bg-muted"
            href="#"
          >
            <FileTextIcon aria-hidden="true" />
            Applications
          </a>
          <a
            className="flex h-12 items-center gap-3 rounded-lg px-4 text-sm font-medium text-secondary-foreground hover:bg-muted"
            href="#"
          >
            <SettingsIcon aria-hidden="true" />
            Settings
          </a>
        </nav>

        <div className="mt-auto flex items-center gap-3 border-t p-5">
          <Avatar>
            <AvatarFallback>SC</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">Sarah Chen</p>
            <p className="truncate text-xs text-muted-foreground">
              sarah@jevmatch.com
            </p>
          </div>
          <ChevronRightIcon aria-hidden="true" className="text-muted-foreground" />
        </div>
      </aside>

      <main className="min-w-0 px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-8">
          <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3 lg:hidden">
                <BrandMark />
                <span className="font-semibold">Jev Match</span>
              </div>
              <h1 className="text-4xl font-semibold tracking-tight">Jobs</h1>
              <p className="text-muted-foreground">
                Create, publish, and review role evaluations.
              </p>
            </div>
            <Button>
              <PlusIcon data-icon="inline-start" />
              New job
            </Button>
          </header>

          <section
            aria-label="Jobs summary"
            className="grid overflow-hidden rounded-xl border bg-surface sm:grid-cols-3"
          >
            {[
              ["Open roles", "3", "Published and accepting applications"],
              ["Drafts", "1", "Not yet published"],
              ["Candidates", "79", "Total across all roles"],
            ].map(([label, value, detail], index) => (
              <div
                className={`flex flex-col gap-1 p-6 ${index > 0 ? "border-t sm:border-t-0 sm:border-l" : ""}`}
                key={label}
              >
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-3xl font-semibold tracking-tight">{value}</p>
                <p className="text-sm text-muted-foreground">{detail}</p>
              </div>
            ))}
          </section>

          <section aria-labelledby="job-list-title" className="flex flex-col gap-5">
            <h2 className="sr-only" id="job-list-title">
              Job list
            </h2>
            <div className="grid gap-3 md:grid-cols-[minmax(260px,1fr)_180px_180px]">
              <div className="relative">
                <label className="sr-only" htmlFor="job-search">
                  Search jobs
                </label>
                <SearchIcon
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  className="h-10 bg-surface pl-10"
                  id="job-search"
                  placeholder="Search roles, skills, or locations..."
                  type="search"
                />
              </div>
              <Select defaultValue="all-statuses">
                <SelectTrigger className="h-10 w-full bg-surface" aria-label="Status">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all-statuses">All statuses</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Select defaultValue="all-owners">
                <SelectTrigger className="h-10 w-full bg-surface" aria-label="Owner">
                  <SelectValue placeholder="All owners" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all-owners">All owners</SelectItem>
                    <SelectItem value="me">Owned by me</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="overflow-hidden rounded-xl border bg-surface">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="h-14 px-5">Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Candidates</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead className="w-14">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => (
                    <TableRow key={job.role} className="h-20">
                      <TableCell className="px-5">
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">{job.role}</span>
                          <span className="text-sm text-muted-foreground">
                            {job.detail}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            job.status === "Published" ? "success" : "neutral"
                          }
                        >
                          {job.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{job.candidates}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {job.updated}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar size="sm">
                            <AvatarFallback>{job.initials}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{job.owner}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              aria-label={`Open actions for ${job.role}`}
                              size="icon-sm"
                              variant="ghost"
                            >
                              <MoreHorizontalIcon />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuGroup>
                              <DropdownMenuItem>Open job</DropdownMenuItem>
                              <DropdownMenuItem>Copy application link</DropdownMenuItem>
                            </DropdownMenuGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="border-t px-5 py-4 text-sm text-muted-foreground">
                Showing 4 of 4 jobs
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
