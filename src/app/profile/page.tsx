"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Providers } from "@/components/Providers";
import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateUser } from "@/lib/firestore";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

function ProfileContent() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [enrollmentNumber, setEnrollmentNumber] = useState(user?.enrollmentNumber || "");
  const [contactNumber, setContactNumber] = useState(user?.contactNumber || "");
  const [parentName, setParentName] = useState(user?.parentName || "");
  const [parentContact, setParentContact] = useState(user?.parentContact || "");
  const [personalEmail, setPersonalEmail] = useState(user?.personalEmail || "");
  const [collegeEmail, setCollegeEmail] = useState(user?.collegeEmail || "");
  const [cabinNo, setCabinNo] = useState(user?.cabinNo || "");
  const [technicalSkills, setTechnicalSkills] = useState<string[]>(user?.technicalSkills || []);
  const [nonTechnicalSkills, setNonTechnicalSkills] = useState<string[]>(user?.nonTechnicalSkills || []);
  const [newTechSkill, setNewTechSkill] = useState("");
  const [newNonTechSkill, setNewNonTechSkill] = useState("");
  const [groupNotificationsEnabled, setGroupNotificationsEnabled] = useState(user?.groupNotificationsEnabled ?? true);
  const [message, setMessage] = useState("");

  const handleUpdate = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const updateData: any = { 
        displayName,
        contactNumber,
      };

      if (user.role === "student") {
        updateData.enrollmentNumber = enrollmentNumber;
        updateData.parentName = parentName;
        updateData.parentContact = parentContact;
        updateData.technicalSkills = technicalSkills;
        updateData.nonTechnicalSkills = nonTechnicalSkills;
      } else if (user.role === "teacher") {
        updateData.personalEmail = personalEmail;
        updateData.collegeEmail = collegeEmail;
        updateData.cabinNo = cabinNo;
        updateData.groupNotificationsEnabled = groupNotificationsEnabled;
      }

      await updateUser(user.id, updateData);
      setMessage("Profile updated successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage("Error updating profile.");
    }
    setLoading(false);
  };

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Account Settings</h1>
          <p className="text-slate-600 mt-1">Manage your profile and preferences</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Update your personal details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-20 h-20 rounded-full border-4 border-slate-100" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center border-4 border-slate-100">
                  <span className="text-2xl font-bold text-slate-500">{user?.displayName?.[0]}</span>
                </div>
              )}
              <div>
                <Badge variant="outline" className="capitalize mb-2">{user?.role}</Badge>
                <p className="text-sm text-slate-500">{user?.email}</p>
              </div>
            </div>

              <Separator />
              <div className="space-y-4">
                {user?.role === "student" ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="displayName">Display Name</Label>
                        <Input
                          id="displayName"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="Enter your name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="enrollmentNumber">Enrollment Number</Label>
                        <Input
                          id="enrollmentNumber"
                          value={enrollmentNumber}
                          onChange={(e) => setEnrollmentNumber(e.target.value)}
                          placeholder="Enter enrollment number"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="contactNumber">Contact Number</Label>
                        <Input
                          id="contactNumber"
                          value={contactNumber}
                          onChange={(e) => setContactNumber(e.target.value)}
                          placeholder="Enter phone number"
                        />
                      </div>
                    </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="parentName">Parent Name</Label>
                          <Input
                            id="parentName"
                            value={parentName}
                            onChange={(e) => setParentName(e.target.value)}
                            placeholder="Father/Mother Name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="parentContact">Parent Contact</Label>
                          <Input
                            id="parentContact"
                            value={parentContact}
                            onChange={(e) => setParentContact(e.target.value)}
                            placeholder="Parent Phone Number"
                          />
                        </div>
                      </div>

                      <Separator />
                      <div className="space-y-4">
                        <Label className="text-lg font-semibold">Skills & Expertise</Label>
                        
                        <div className="space-y-3">
                          <Label>Technical Skills</Label>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {technicalSkills.map((skill, index) => (
                              <Badge key={index} variant="secondary" className="pl-3 pr-2 py-1 flex items-center gap-1 group">
                                {skill}
                                <button 
                                  onClick={() => setTechnicalSkills(technicalSkills.filter((_, i) => i !== index))}
                                  className="text-slate-400 hover:text-red-500 transition-colors"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </Badge>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <Input
                              value={newTechSkill}
                              onChange={(e) => setNewTechSkill(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), newTechSkill.trim() && (setTechnicalSkills([...technicalSkills, newTechSkill.trim()]), setNewTechSkill("")))}
                              placeholder="Add a technical skill (e.g. React, Python)"
                              className="max-w-xs"
                            />
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={() => newTechSkill.trim() && (setTechnicalSkills([...technicalSkills, newTechSkill.trim()]), setNewTechSkill(""))}
                            >
                              Add
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <Label>Non-Technical Skills</Label>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {nonTechnicalSkills.map((skill, index) => (
                              <Badge key={index} variant="secondary" className="pl-3 pr-2 py-1 flex items-center gap-1 group">
                                {skill}
                                <button 
                                  onClick={() => setNonTechnicalSkills(nonTechnicalSkills.filter((_, i) => i !== index))}
                                  className="text-slate-400 hover:text-red-500 transition-colors"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </Badge>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <Input
                              value={newNonTechSkill}
                              onChange={(e) => setNewNonTechSkill(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), newNonTechSkill.trim() && (setNonTechnicalSkills([...nonTechnicalSkills, newNonTechSkill.trim()]), setNewNonTechSkill("")))}
                              placeholder="Add a non-technical skill (e.g. Leadership, Writing)"
                              className="max-w-xs"
                            />
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={() => newNonTechSkill.trim() && (setNonTechnicalSkills([...nonTechnicalSkills, newNonTechSkill.trim()]), setNewNonTechSkill(""))}
                            >
                              Add
                            </Button>
                          </div>
                        </div>
                      </div>
                    </>

                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="displayName">Name</Label>
                        <Input
                          id="displayName"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="Enter your name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contactNumber">Phone</Label>
                        <Input
                          id="contactNumber"
                          value={contactNumber}
                          onChange={(e) => setContactNumber(e.target.value)}
                          placeholder="Enter phone number"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="personalEmail">Personal Email</Label>
                        <Input
                          id="personalEmail"
                          value={personalEmail}
                          onChange={(e) => setPersonalEmail(e.target.value)}
                          placeholder="Enter personal email"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="collegeEmail">College Email</Label>
                        <Input
                          id="collegeEmail"
                          value={collegeEmail}
                          onChange={(e) => setCollegeEmail(e.target.value)}
                          placeholder="Enter college email"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="cabinNo">Cabin No</Label>
                        <Input
                          id="cabinNo"
                          value={cabinNo}
                          onChange={(e) => setCabinNo(e.target.value)}
                          placeholder="Enter cabin number"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="pt-2">
                  <Button onClick={handleUpdate} disabled={loading}>
                    {loading ? "Saving..." : "Save Changes"}
                  </Button>
                  {message && (
                    <span className={`ml-4 text-sm ${message.includes("Error") ? "text-red-500" : "text-emerald-500"}`}>
                      {message}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {user?.role === "teacher" && (
            <Card>
              <CardHeader>
                <CardTitle>Preferences</CardTitle>
                <CardDescription>Customize your notification settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Group Wise Notifications</Label>
                    <p className="text-sm text-slate-500">
                      When enabled, all team members will receive notifications sent to their team.
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="groupNotifications"
                      checked={groupNotificationsEnabled}
                      onChange={(e) => setGroupNotificationsEnabled(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-slate-900 focus:ring-slate-900"
                    />
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <Button onClick={handleUpdate} variant="outline" disabled={loading}>
                    Update Preferences
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

        <Card className="border-red-100 bg-red-50/30">
          <CardHeader>
            <CardTitle className="text-red-700">Danger Zone</CardTitle>
            <CardDescription>Irreversible account actions</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive">Delete Account</Button>
            <p className="mt-2 text-xs text-slate-500">
              This will permanently delete your account and all associated data.
            </p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

export default function ProfilePage() {
  return (
    <Providers>
      <ProfileContent />
    </Providers>
  );
}
