import { sendMail } from "infra/mailer.js";
import {
  deleteAllEmails,
  getLastEmail,
  waitForAllServices,
} from "tests/orchestrator.js";

beforeAll(async () => {
  await waitForAllServices();
  await deleteAllEmails();
});

describe("Simple Mailer Test", () => {
  test("sendMail() should send an email", async () => {
    await sendMail({
      from: "AutomaNews <boas_vindas@automanews.com.br>",
      to: "first_user@test.com",
      subject: "Primeiro email enviado.",
      text: "Corpo em texto do primeiro email.",
    });
    await sendMail({
      from: "AutomaNews <boas_vindas@automanews.com.br>",
      to: "last_user@test.com",
      subject: "Último email enviado.",
      text: "Corpo em texto do último email.",
    });

    const lastEmail = await getLastEmail();

    expect(lastEmail.sender).toBe("<boas_vindas@automanews.com.br>");
    expect(lastEmail.recipients[0]).toBe("<last_user@test.com>");
    expect(lastEmail.subject).toBe("Último email enviado.");
    expect(lastEmail.text).toBe("Corpo em texto do último email.\r\n");
  });
});
