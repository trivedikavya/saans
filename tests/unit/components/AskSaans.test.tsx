import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AskSaans } from "@/components/chat/AskSaans";
import { t } from "@/lib/i18n";

function mockStreamingResponse(chunks: string[]): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });
  return new Response(stream);
}

describe("AskSaans", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends the typed message and streams the assistant's reply into view", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockStreamingResponse(["Ventilate ", "after the morning peak."])));
    const user = userEvent.setup();

    render(<AskSaans usAqi={120} pm25={70} locationName="Delhi" language="en" />);

    const input = screen.getByPlaceholderText(t("en", "chatPlaceholder"));
    await user.type(input, "Should I ventilate right now?");
    await user.click(screen.getByRole("button", { name: t("en", "chatSend") }));

    expect(await screen.findByText("Should I ventilate right now?")).toBeInTheDocument();
    expect(await screen.findByText("Ventilate after the morning peak.")).toBeInTheDocument();
  });

  it("sends the request body with the current AQI/location context", async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockStreamingResponse(["ok"]));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(<AskSaans usAqi={200} pm25={150} locationName="Lucknow" language="en" />);
    await user.type(screen.getByPlaceholderText(t("en", "chatPlaceholder")), "hi");
    await user.click(screen.getByRole("button", { name: t("en", "chatSend") }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/chat",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining('"usAqi":200'),
      })
    );
  });

  it("does not submit an empty message", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(<AskSaans usAqi={120} pm25={70} locationName="Delhi" language="en" />);
    await user.click(screen.getByRole("button", { name: t("en", "chatSend") }));

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows a generic error message if the request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network down"))
    );
    const user = userEvent.setup();

    render(<AskSaans usAqi={120} pm25={70} locationName="Delhi" language="en" />);
    await user.type(screen.getByPlaceholderText(t("en", "chatPlaceholder")), "hi");
    await user.click(screen.getByRole("button", { name: t("en", "chatSend") }));

    expect(await screen.findByText(t("en", "errorGeneric"))).toBeInTheDocument();
  });
});
