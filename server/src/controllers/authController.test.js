import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";

import User from "../../models/User.js";
import { resetPassword } from "./authController.js";

function createJsonResponse() {
  return {
    statusCode: 200,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
  };
}

test("resetPassword verifies account after a valid email reset link is used", async (t) => {
  const originalFindOne = User.findOne;
  t.after(() => {
    User.findOne = originalFindOne;
  });

  const resetToken = "valid-reset-token-with-enough-length";
  const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  const user = {
    password: "old-password",
    isVerified: false,
    verificationToken: "stale-verification-token",
    verificationTokenExpiry: new Date(Date.now() + 60_000),
    passwordResetToken: hashedToken,
    passwordResetExpiry: new Date(Date.now() + 60_000),
    saveCalled: false,
    async save() {
      this.saveCalled = true;
    },
  };

  User.findOne = async (query) => {
    assert.equal(query.passwordResetToken, hashedToken);
    assert.ok(query.passwordResetExpiry.$gt <= Date.now());
    return user;
  };

  const res = createJsonResponse();

  await resetPassword(
    {
      body: {
        token: resetToken,
        password: "NewPassword123",
        passwordConfirm: "NewPassword123",
      },
    },
    res,
  );

  assert.equal(res.statusCode, 200);
  assert.equal(res.payload.success, true);
  assert.equal(user.password, "NewPassword123");
  assert.equal(user.passwordResetToken, undefined);
  assert.equal(user.passwordResetExpiry, undefined);
  assert.equal(user.isVerified, true);
  assert.equal(user.verificationToken, undefined);
  assert.equal(user.verificationTokenExpiry, undefined);
  assert.equal(user.saveCalled, true);
});
