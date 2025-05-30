import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { ChatMessage } from '@/types/chat';

interface UserRandomMessagesProps {
  userRandomMessages?: { user: string; message: ChatMessage }[];
}

const UserRandomMessages: React.FC<UserRandomMessagesProps> = ({ userRandomMessages }) => {
  if (!userRandomMessages || userRandomMessages.length === 0) {
    return (
      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Random Message per User</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Random message data not available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Random Message per User</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {userRandomMessages.map(({ user, message }) => (
          <div key={message.id}>
            <p className="font-semibold">{user}:</p>
            <p className="text-sm text-gray-700">{message.message}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default UserRandomMessages;