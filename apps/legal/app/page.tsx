import Image from "next/image";
import Logo from "./assets/logo.png";

export default function Home() {
  return (
    <div className="max-w-7xl self-center flex flex-col space-y-8 px-4 md:px-8">
      <header className="flex flex-col items-center">
        <Image
          src={Logo}
          width={128}
          height={64}
          alt="Rhiva"
        />
        <h1 className="text-3xl text-primary font-semibold">
          Beta Terms & Conditions
        </h1>
        <p className="text-gray">Last Updated [Sat 25th, Oct 2025]</p>
      </header>
      <div className="flex flex-col space-y-8">
        <p>
          Welcome to the Rhiva. We’re excited to have you join us as we test and
          improve our liquidity yield aggregator on Solana. Before you dive in,
          please read these simple terms so we’re all on the same page.
        </p>
        <ul className="flex flex-col space-y-4">
          <ol>
            <p className="text-white text-lg font-semibold">1. Product Beta</p>
            <p>
              Rhiva is currently in beta which means things are still
              experimental. Features may change, break, or even disappear
              without notice. Joining the beta doesn’t guarantee you’ll always
              have access to future versions.
            </p>
          </ol>

          <ol>
            <p className="text-white text-lg font-semibold">
              2. No Financial Advice
            </p>
            <p>
              Rhiva helps you explore liquidity and yield opportunities on
              Solana, but we are not giving financial advice. All choices you
              make (adding liquidity, farming, etc.) are 100% your
              responsibility.
            </p>
          </ol>
          <ol>
            <p className="text-white text-lg font-semibold">
              3. Risks You Should Know
            </p>
            <p>
              DeFi and blockchain come with risks: token volatility, smart
              contract bugs, or even total loss of funds. Since this is a beta
              product, expect possible glitches, downtime, or unexpected
              behavior. You’re using Rhiva at your own risk.
            </p>
          </ol>
          <ol>
            <p className="text-white text-lg font-semibold">
              4. Security Check (But No Guarantees)
            </p>
            <p>
              Rhiva’s contracts have been reviewed by third-party security
              platforms 🔒. This adds an extra layer of protection, but it does
              not guarantee 100% safety. Always do your own research and only
              risk what you can afford to lose.
            </p>
          </ol>
          <ol>
            <p className="text-white text-lg font-semibold">5. Who Can Join</p>
            <p>
              You must be 18+ (or the legal age in your country). Make sure your
              local laws allow you to use blockchain/DeFi services.
            </p>
          </ol>
          <ol>
            <p className="text-white text-lg font-semibold">7. No Promises</p>
            <p>
              Rhiva is provided “as is” during beta. We don’t promise uptime,
              specific yields, or perfect performance.
            </p>
          </ol>
          <ol>
            <p className="text-white text-lg font-semibold">8. Liability</p>
            <p>
              We (the Rhiva team, partners, or affiliates) are not responsible
              for: Lost tokens or funds Hacks, bugs, or unexpected issues Missed
              profits or financial losses
            </p>
          </ol>
          <ol>
            <p className="text-white text-lg font-semibold">
              9. Feedback Rights
            </p>
            <p>
              Any feedback you give us can be used to improve Rhiva. By sending
              it, you let us use it freely (but don’t worry, you still own your
              ideas).
            </p>
          </ol>
          <ol>
            <p className="text-white text-lg font-semibold">10. Updates</p>
            <p>
              We may change or stop the beta at any time. If these Terms change,
              continuing to use Rhiva means you accept the new version.
            </p>
          </ol>
          <ol>
            <p className="text-white text-lg font-semibold">
              11. Acknowledgment
            </p>
            <p>By using Rhiva Beta, you agree that you:</p>
            <ul>
              <li>✅ Understand it’s experimental</li>
              <li>✅ Accept the risks involved</li>
              <li>
                ✅ Know third-party checks reduce risks but don’t eliminate them
              </li>
              <li>✅ Take full responsibility for your own use</li>
            </ul>
          </ol>
        </ul>
      </div>
    </div>
  );
}
