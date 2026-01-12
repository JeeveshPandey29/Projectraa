"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResearchPaper, CopyrightPatent } from "@/lib/types";
import { ResearchTracker } from "./ResearchTracker";
import { CopyrightPatentTracker } from "./CopyrightPatentTracker";
import { BookOpen, Shield } from "lucide-react";

interface IPResearchTrackerProps {
  projectId: string;
  papers: ResearchPaper[];
  items: CopyrightPatent[];
  onRefresh: () => void;
  canEdit: boolean;
}

export function IPResearchTracker({ projectId, papers, items, onRefresh, canEdit }: IPResearchTrackerProps) {
  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold text-slate-900">IP & Research Repository</CardTitle>
            <CardDescription className="text-slate-500">
              Centralized hub for all academic publications, copyrights, and patents.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-0">
        <Tabs defaultValue="research" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-6">
            <TabsTrigger value="research" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Research Papers
            </TabsTrigger>
            <TabsTrigger value="ip" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Copyright/Patent
            </TabsTrigger>
          </TabsList>

          <TabsContent value="research">
            <ResearchTracker 
              projectId={projectId}
              papers={papers}
              onRefresh={onRefresh}
              canEdit={canEdit}
            />
          </TabsContent>

          <TabsContent value="ip">
            <CopyrightPatentTracker 
              projectId={projectId}
              items={items}
              onRefresh={onRefresh}
              canEdit={canEdit}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
