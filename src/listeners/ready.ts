import { Listener } from "@sapphire/framework";

export class ReadyListener extends Listener {
  public constructor(context: Listener.LoaderContext) {
    super(context, {
      event: "ready",
      once: true,
    });
  }

  public run() {
    this.container.logger.info(
      `Ready! Logged in as ${this.container.client.user?.tag}`
    );
  }
}
