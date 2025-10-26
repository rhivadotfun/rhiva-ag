"use client";

import type { z } from "zod";
import type { messageSelectSchema } from "@rhiva-ag/datasource";
import PoolPositionCard from "./PoolPositionCard";

type Message = z.infer<typeof messageSelectSchema>;

interface MessageRendererProps {
  message: Message;
}

export default function MessageRenderer({ message }: MessageRendererProps) {
  const isUser = message.role === "user";
  const content = message.content as any;

  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4 px-4`}
    >
      <div
        className={`max-w-3xl ${isUser ? "bg-blue-600/20 border-blue-500/30" : "bg-zinc-800/50 border-zinc-700/50"} border rounded-lg p-4`}
      >
        {/* User message */}
        {isUser && content?.text && (
          <p className="text-white whitespace-pre-wrap">{content.text}</p>
        )}

        {/* Assistant message with summary */}
        {!isUser && content?.summary && (
          <div className="mb-4">
            <p className="text-zinc-300">{content.summary}</p>
          </div>
        )}

        {/* Pool recommendations */}
        {!isUser && content?.pools && Array.isArray(content.pools) && (
          <div className="space-y-4">
            {content.pools.length > 0 && (
              <h4 className="text-white font-semibold mb-3">
                Pool Recommendations
              </h4>
            )}
            <div className="grid gap-4 md:grid-cols-2">
              {content.pools.map((pool: any, index: number) => (
                <PoolPositionCard
                  key={pool.address || index}
                  pool={pool}
                  onOpenPosition={(pool) => {
                    // TODO: Implement position opening logic
                    console.log("Opening position for pool:", pool);
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Token recommendations */}
        {!isUser && content?.tokens && Array.isArray(content.tokens) && (
          <div className="space-y-2">
            {content.tokens.length > 0 && (
              <h4 className="text-white font-semibold mb-3">
                Token Recommendations
              </h4>
            )}
            <div className="space-y-2">
              {content.tokens.map((token: any, index: number) => (
                <div
                  key={token.id || index}
                  className="bg-zinc-900/50 border border-zinc-700 rounded-lg p-3"
                >
                  <div className="flex items-center gap-3">
                    {token.icon && (
                      <img
                        src={token.icon}
                        alt={token.symbol}
                        className="w-8 h-8 rounded-full"
                      />
                    )}
                    <div className="flex-1">
                      <h5 className="text-white font-semibold">
                        {token.name || token.symbol}
                      </h5>
                      <p className="text-zinc-400 text-sm">{token.symbol}</p>
                    </div>
                    {token.usdPrice && (
                      <p className="text-green-400 font-semibold">
                        ${token.usdPrice.toFixed(4)}
                      </p>
                    )}
                  </div>
                  {token.analysis && (
                    <div className="mt-2 pt-2 border-t border-zinc-700">
                      <div className="flex gap-4 text-sm">
                        <div>
                          <span className="text-zinc-500">Confidence: </span>
                          <span className="text-white">
                            {(token.analysis.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                        {token.analysis.suggestedDeposit && (
                          <div>
                            <span className="text-zinc-500">
                              Suggested Deposit:{" "}
                            </span>
                            <span className="text-white">
                              $
                              {token.analysis.suggestedDeposit.toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Position status updates */}
        {!isUser && content?.positions && Array.isArray(content.positions) && (
          <div className="space-y-2">
            {content.positions.length > 0 && (
              <h4 className="text-white font-semibold mb-3">Positions</h4>
            )}
            <div className="space-y-2">
              {content.positions.map((position: any, index: number) => (
                <div
                  key={position.id || index}
                  className="bg-zinc-900/50 border border-zinc-700 rounded-lg p-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-white font-semibold">
                        {position.baseToken?.symbol}/
                        {position.quoteToken?.symbol}
                      </h5>
                      <p className="text-zinc-400 text-sm">
                        Status:{" "}
                        <span
                          className={
                            position.status === "successful"
                              ? "text-green-400"
                              : position.status === "error"
                                ? "text-red-400"
                                : "text-yellow-400"
                          }
                        >
                          {position.status}
                        </span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-semibold">
                        ${position.amountUsd.toLocaleString()}
                      </p>
                      {position.pnl && (
                        <p
                          className={
                            position.pnl.pnlUsd >= 0
                              ? "text-green-400"
                              : "text-red-400"
                          }
                        >
                          PnL: ${position.pnl.pnlUsd.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bundle ID for transactions */}
        {!isUser && content?.bundleId && (
          <div className="mt-3 p-2 bg-zinc-900/50 border border-zinc-700 rounded">
            <p className="text-xs text-zinc-400">
              Transaction Bundle ID:{" "}
              <span className="text-zinc-300 font-mono">
                {content.bundleId}
              </span>
            </p>
          </div>
        )}

        {/* Fallback for unknown content types */}
        {!isUser &&
          !content?.summary &&
          !content?.pools &&
          !content?.tokens &&
          !content?.positions &&
          content?.text && (
            <p className="text-zinc-300 whitespace-pre-wrap">{content.text}</p>
          )}
      </div>
    </div>
  );
}
