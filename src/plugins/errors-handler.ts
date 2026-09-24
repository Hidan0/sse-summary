import type { App, ComponentPublicInstance, Plugin } from "vue";

import { NetworkException } from "@byloth/core";
import { HandledException, HandlerBuilder } from "@byloth/exceptions";

const errorsHandler: Plugin = {
    install(app: App, ...options: unknown[]): void
    {
        const { $vuert } = app.config.globalProperties;
        const _handler = new HandlerBuilder()
            .on(NetworkException, (exc) =>
            {
                $vuert.emit({
                    type: "error",
                    icon: "link-slash",
                    title: "Network error!",
                    message: `${exc.message} Please, try again later.`,
                    dismissible: true
                });

                return new HandledException(exc);
            })
            .default((exc) =>
            {
                // eslint-disable-next-line no-console
                console.error(exc);

                $vuert.emit({
                    type: "error",
                    icon: "circle-xmark",
                    title: "Oh, oh...",
                    message: "Something went wrong; please, reload the page.",
                    dismissible: true
                });
            });

        app.config.errorHandler = (error: unknown, instance: ComponentPublicInstance | null, info: string) =>
        {
            const result = _handler.handle(error);
            if (result instanceof HandledException)
            {
                // eslint-disable-next-line no-console
                console.warn(result);
            }
        };

        window.addEventListener("unhandledrejection", (evt: PromiseRejectionEvent) =>
        {
            evt.preventDefault();

            const result = _handler.handle(evt.reason);
            if (result instanceof HandledException)
            {
                // eslint-disable-next-line no-console
                console.warn(result);
            }
        });
    }
};

export default errorsHandler;
