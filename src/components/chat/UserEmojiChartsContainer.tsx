"use client";

import React, { useMemo } from 'react';
import { ChatMessage } from '@/types/chat';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import TopEmojisChart from './TopEmojisChart';
import { extractEmojis } from '@/lib/chat-parser';

interface UserEmojiChartsContainerProps {
  messages: ChatMessage[];
}

const UserEmojiChartsContainer: React.FC<UserEmojiChartsContainerProps> = ({ messages }) => {
  const userEmojiData = useMemo(() => {
    const userEmojis: { [user: string]: { [emoji: string]: number } } = {};

    messages.forEach(message => {
      // Basic regex to find potential emojis
      const emojiRegex = /([\uD800-\uDBFF][\uDC00-\uDFFF]|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDE4F]|[\u2600-\u26FF]|[\u2700-\u27BF])/g;
      const emojisInMessage = message.message.match(emojiRegex);

      if (emojisInMessage) {
        if (!userEmojis[message.user]) {
          userEmojis[message.user] = {};
        }
        emojisInMessage.forEach(emoji => {
          userEmojis[message.user][emoji] = (userEmojis[message.user][emoji] || 0) + 1;
        });
      }
    });

    // Filter users who sent at least one emoji and get top 5
    const usersWithEmojis = Object.entries(userEmojis)
      .filter(([, emojis]) => Object.keys(emojis).length > 0)
      .map(([user, emojis]) => {
        const sortedEmojis = Object.entries(emojis)
          .sort(([, countA], [, countB]) => countB - countA)
          .slice(0, 5)
          .map(([emoji, count]) => ({ emoji, count }));
        return { user, topEmojis: sortedEmojis };
      });

    return usersWithEmojis;
  }, [messages]);


  if (!userEmojiData || userEmojiData.length === 0) {
    return null; // Or a message indicating no emoji data
  }

  return (
    <>
      {userEmojiData.map(({ user, topEmojis }) => (
        <div key={user} className="mb-6 last:mb-0">
          <h2 className="text-lg font-semibold mb-2">{`${user}'s Top Emojis`}</h2>
          <TopEmojisChart data={topEmojis} hideTitleAndDescription={true} />
        </div>
      ))}
    </>
  );
};

export default UserEmojiChartsContainer;