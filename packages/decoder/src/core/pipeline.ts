import assert from "assert";
import type { web3 } from "@coral-xyz/anchor";

import { LogProcessor } from "./processors/log-processor";
import { InstructionProcessor } from "./processors/instruction-processor";

export class Pipeline<T extends InstructionProcessor<any> | LogProcessor<any>> {
  private readonly logPipes: LogProcessor<unknown>[];
  private readonly instructionPipes: InstructionProcessor<unknown>[];

  constructor(pipes: T[]) {
    this.logPipes = [];
    this.instructionPipes = [];

    for (const pipe of pipes) this.addPipes(pipe);
  }

  addPipes(pipe: T) {
    if (pipe instanceof InstructionProcessor) this.instructionPipes?.push(pipe);
    else if (pipe instanceof LogProcessor) this.logPipes?.push(pipe);
  }

  async process(
    ...parsedTransactionWithMetas: web3.ParsedTransactionWithMeta[]
  ) {
    return Promise.all(
      parsedTransactionWithMetas.map((parsedTransactionWithMeta) => {
        const nestedInstructions = this.getNestedInstructions(
          parsedTransactionWithMeta,
        );

        const promiseJoins = [];
        const blockTime = parsedTransactionWithMeta.blockTime;
        const signature = parsedTransactionWithMeta.transaction.signatures[0]!;

        if (parsedTransactionWithMeta.meta?.logMessages && this.logPipes)
          promiseJoins.push(
            ...this.logPipes.map((pipe) => {
              const parsedEvents = pipe.process(
                parsedTransactionWithMeta.meta!.logMessages!,
              );
              if (parsedEvents && parsedEvents.length > 0)
                return pipe.consume(parsedEvents, {
                  signature,
                });

              return null;
            }),
          );
        if (this.instructionPipes) {
          promiseJoins.push(
            ...this.instructionPipes.map((pipe) => {
              const parsedInstructions = pipe.process(...nestedInstructions);
              if (parsedInstructions.length > 0)
                return pipe.consume(parsedInstructions, {
                  signature,
                  blockTime,
                });
              return null;
            }),
          );
        }

        return Promise.all(promiseJoins.filter(Boolean));
      }),
    );
  }

  protected getNestedInstructions(
    parsedTransactionWithMeta: web3.ParsedTransactionWithMeta,
  ) {
    assert(parsedTransactionWithMeta.meta, "meta expected in transaction");

    const nestedInstructions: (
      | web3.ParsedInstruction
      | web3.PartiallyDecodedInstruction
    )[] = [...parsedTransactionWithMeta.transaction.message.instructions];

    const { innerInstructions } = parsedTransactionWithMeta.meta;

    if (innerInstructions)
      for (const { instructions } of innerInstructions)
        nestedInstructions.push(...instructions);

    return nestedInstructions;
  }
}
