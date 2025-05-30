"use client";

import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UserLongestMessages as UserLongestMessagesType } from '@/types/chat';

interface UserLongestMessagesProps {
  userLongestMessages: UserLongestMessagesType[] | undefined;
}

const UserLongestMessages: React.FC<UserLongestMessagesProps> = ({ userLongestMessages }) => {
  if (!userLongestMessages || userLongestMessages.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Longest Messages Per User</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Longest message data not available for any user (or users have less than 3 messages).</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <CardTitle>Top Longest Messages Per User</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {userLongestMessages.map(({ user, messages }) => (
          <div key={user} className="border-b pb-4 last:border-b-0 last:pb-0">
            <h3 className="text-lg font-semibold mb-2">{user}'s Longest Messages:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              {messages.map((msg, index) => (
                <li key={index} className="break-words">
                  {msg.message}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default UserLongestMessages;