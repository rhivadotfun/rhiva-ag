"use client";
import type z from "zod";
import { object, string } from "yup";
import { FiSend } from "react-icons/fi";
import { useCallback, useMemo } from "react";
import { Field, FormikContext, useFormik } from "formik";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  messageSelectSchema,
  threadSelectSchema,
} from "@rhiva-ag/datasource";

import Header from "@/components/ai/Header";
import EmptyChat from "@/components/ai/EmptyChat";
import { useTRPC, useTRPCClient } from "@/trpc.client";

type AiPageClientProps = {
  threads: z.infer<typeof threadSelectSchema>[];
};

export default function AiPageClient({ threads }: AiPageClientProps) {
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();
  const queryClient = useQueryClient();

  const formikContext = useFormik({
    validationSchema: object({
      prompt: string().trim().required(),
    }),
    initialValues: {
      prompt: "",
      thread: threads[0],
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
        prompt: values.prompt,
      });
    },
  });

  const { values, setFieldValue } = formikContext;

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
      <div className="flex-1 flex flex-col overflow-y-scroll">
        <Header
          canBack
          className="sticky top-0 z-10 sm:bg-white/10 sm:backdrop-blur-3xl"
        />
        <div className="flex-1 flex flex-col overflow-y-scroll">
          {isFetching && <div className="m-auto" />}
          {messages?.length ? (
            messages.map((message) => (
              <div key={message.id}>
                <pre>{JSON.stringify(message.content)}</pre>
              </div>
            ))
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
    </FormikContext>
  );
}
