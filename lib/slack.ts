interface SlackMessage {
  channel: string;
  text: string;
  username?: string;
  icon_emoji?: string;
  attachments?: Array<{
    color: string;
    title: string;
    text: string;
    fields?: Array<{
      title: string;
      value: string;
      short: boolean;
    }>;
  }>;
}

export class SlackNotifier {
  private webhookUrl: string;
  private rateLimiter: Map<string, number>;
  private readonly RATE_LIMIT = 5000; // 5초
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAYS = [1000, 2000, 4000]; // 지수 백오프

  constructor() {
    this.webhookUrl = process.env.SLACK_WEBHOOK_URL || "";
    this.rateLimiter = new Map();
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private isRateLimited(key: string): boolean {
    const now = Date.now();
    const lastSent = this.rateLimiter.get(key) || 0;
    return now - lastSent < this.RATE_LIMIT;
  }

  private updateRateLimit(key: string): void {
    this.rateLimiter.set(key, Date.now());
  }

  async sendAlert(message: SlackMessage): Promise<void> {
    if (!this.webhookUrl) {
      console.warn("Slack webhook URL not configured");
      return;
    }

    const key = `${message.channel}:${message.text}`;
    if (this.isRateLimited(key)) {
      console.log("Rate limited: Skipping duplicate alert");
      return;
    }

    for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(this.webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...message,
            username: message.username || "Farm Dev Bot",
            icon_emoji: message.icon_emoji || ":warning:",
          }),
        });

        if (!response.ok) {
          throw new Error(`Slack API error: ${response.status}`);
        }

        this.updateRateLimit(key);
        return;
      } catch (error) {
        console.error(
          `Slack 알림 전송 실패 (시도 ${attempt + 1}/${this.MAX_RETRIES}):`,
          error
        );

        if (attempt === this.MAX_RETRIES - 1) {
          throw error;
        }

        await this.sleep(this.RETRY_DELAYS[attempt]);
      }
    }
  }

  async sendSystemAlert(
    level: "info" | "warning" | "error",
    title: string,
    message: string,
    context?: Record<string, any>
  ): Promise<void> {
    const colors = {
      info: "#36a64f",
      warning: "#ff9500",
      error: "#ff0000",
    };

    const emojis = {
      info: ":information_source:",
      warning: ":warning:",
      error: ":rotating_light:",
    };

    await this.sendAlert({
      channel: "#alerts",
      text: `${emojis[level]} ${title}`,
      attachments: [
        {
          color: colors[level],
          title,
          text: message,
          fields: context
            ? Object.entries(context).map(([key, value]) => ({
                title: key,
                value:
                  typeof value === "object"
                    ? JSON.stringify(value)
                    : String(value),
                short: true,
              }))
            : undefined,
        },
      ],
    });
  }
}

// 전역 인스턴스
export const slackNotifier = new SlackNotifier();
