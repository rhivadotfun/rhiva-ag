"use client";
import type z from "zod";
import { object, string } from "yup";
import { FiSend } from "react-icons/fi";
import { useCallback, useMemo, useState } from "react";
import { Field, FormikContext, useFormik } from "formik";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  messageSelectSchema,
  threadSelectSchema,
} from "@rhiva-ag/datasource";

import Header from "@/components/ai/Header";
import EmptyChat from "@/components/ai/EmptyChat";
import ChatSidebar from "@/components/ai/ChatSidebar";
import MessageRenderer from "@/components/ai/MessageRenderer";
import { useTRPC, useTRPCClient } from "@/trpc.client";

type AiPageClientProps = {
  searchParams: { prompt?: string };
  threads: z.infer<typeof threadSelectSchema>[];
};

export default function AiPageClient({
  searchParams,
  threads,
}: AiPageClientProps) {
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();
  const queryClient = useQueryClient();
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  const formikContext = useFormik({
    validationSchema: object({
      prompt: string().trim().required(),
    }),
    initialValues: {
      thread: threads[0],
      prompt: searchParams.prompt,
    },
    async onSubmit(values, { setFieldValue, resetForm }) {
      const data = {
        role: "user" as const,
        id: crypto.randomUUID(),
        thread: values.thread?.id,
        content: {
          text: values.prompt,
        },
        createdAt: new Date(),
      };
      updateMessages(data);
      resetForm({ values: { ...values, prompt: "" } });

      if (!values.thread) {
        const thread = await trpcClient.ai.thread.create.mutate({});
        data.thread = thread.id;
        setFieldValue("thread", thread);
      }

      await mutateAsync({
        ...data,
        prompt: values.prompt!,
      });
    },
  });

  const { values, setFieldValue } = formikContext;

  const handleNewChat = useCallback(() => {
    setFieldValue("thread", null);
    setFieldValue("prompt", "");
    queryClient.setQueryData(["messages", null], []);
  }, [setFieldValue, queryClient]);

  const handleThreadSelect = useCallback(
    (thread: z.infer<typeof threadSelectSchema>) => {
      setFieldValue("thread", thread);
      setFieldValue("prompt", "");
      setShowMobileSidebar(false); // Close sidebar on mobile after selection
    },
    [setFieldValue],
  );

  const messageKey = useMemo(
    () => ["messages", values.thread?.id],
    [values.thread?.id],
  );

  const updateMessages = useCallback(
    (...messages: z.infer<typeof messageSelectSchema>[]) => {
      queryClient.setQueryData<z.infer<typeof messageSelectSchema>[]>(
        messageKey,
        (oldData) => {
          if (!oldData) return messages;
          return [...oldData, ...messages];
        },
      );
    },
    [queryClient, messageKey],
  );

  const { mutateAsync } = useMutation(
    trpc.ai.message.create.mutationOptions({
      onSuccess(data) {
        updateMessages(...data);
      },
    }),
  );

  const { data: messages, isFetching } = useQuery({
    queryKey: messageKey,
    enabled: Boolean(values.thread),
    queryFn: async () => {
      const messages = await trpcClient.ai.message.list.query({
        filter: {
          thread: { eq: values.thread.id },
        },
      });

      return messages;
    },
  });

  return (
    <FormikContext value={formikContext}>
      <div className="flex-1 flex h-screen overflow-hidden">
        {/* Sidebar - Desktop only */}
        <ChatSidebar
          threads={threads}
          activeThread={values.thread}
          onThreadSelect={handleThreadSelect}
          onNewChat={handleNewChat}
          className="lt-sm:hidden bg-white/10 backdrop-blur-2xl"
        />

        {/* Mobile Sidebar Drawer */}
        {showMobileSidebar && (
          <>
            {/* Backdrop */}
            <button
              type="button"
              className="sm:hidden fixed inset-0 bg-black/50 z-40"
              onClick={() => setShowMobileSidebar(false)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setShowMobileSidebar(false);
                }
              }}
              aria-label="Close sidebar"
            />
            {/* Drawer */}
            <ChatSidebar
              threads={threads}
              activeThread={values.thread}
              onThreadSelect={handleThreadSelect}
              onNewChat={() => {
                handleNewChat();
                setShowMobileSidebar(false);
              }}
              className="sm:hidden fixed left-0 top-0 bottom-0 z-50"
            />
          </>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col backdrop-blur-2xl overflow-hidden">
          <Header
            canBack
            onMenuClick={() => setShowMobileSidebar(true)}
            className="sticky top-0 z-10 sm:bg-white/10 sm:backdrop-blur-3xl"
          />
          <div className="flex-1 flex flex-col overflow-y-scroll">
            {isFetching && <div className="m-auto" />}
            {messages?.length ? (
              <div className="py-6">
                {messages.map((message) => (
                  <MessageRenderer
                    key={message.id}
                    message={message}
                  />
                ))}
              </div>
            ) : (
              <EmptyChat onPrompt={(value) => setFieldValue("prompt", value)} />
            )}
          </div>
          <div className="sticky bottom-0 flex sm:items-center sm:justify-center sm:bg-white/10">
            <div className="flex  items-center space-x-4 p-4 z-10 sm:self-center w-full sm:max-w-7xl">
              <Field
                as="textarea"
                name="prompt"
                placeholder="Ask me anything..."
                className="flex-1 p-3 bg-transparent border border-white/10 rounded focus:border-primary"
              />
              <button
                type="submit"
                className="size-12 aspect-square flex items-center justify-center bg-primary/20 p-2 rounded"
              >
                <FiSend size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </FormikContext>
  );
}
