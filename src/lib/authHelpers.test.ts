import { describe, expect, it } from "vitest";
import {
  MIN_PASSWORD_LENGTH,
  RECOVERY_CODE_LENGTH,
  validateEmail,
  validatePassword,
  validateNewPassword,
  validateRecoveryCode,
  describeAuthError,
} from "./authHelpers";

describe("validateEmail", () => {
  it("accepts a normal address", () => {
    expect(validateEmail("reader@example.com")).toBeNull();
  });

  it("trims surrounding whitespace before validating", () => {
    expect(validateEmail("  reader@example.com  ")).toBeNull();
  });

  it("rejects an empty value", () => {
    expect(validateEmail("")).toBe("Enter your email address.");
  });

  it("rejects something without an @ and domain", () => {
    expect(validateEmail("not-an-email")).toMatch(/valid email/i);
  });
});

describe("validatePassword", () => {
  it("accepts a password at the minimum length", () => {
    expect(validatePassword("a".repeat(MIN_PASSWORD_LENGTH))).toBeNull();
  });

  it("rejects an empty password", () => {
    expect(validatePassword("")).toBe("Enter your password.");
  });

  it("rejects a too-short password", () => {
    expect(validatePassword("abc")).toMatch(
      new RegExp(`${MIN_PASSWORD_LENGTH} characters`)
    );
  });
});

describe("validateNewPassword", () => {
  it("passes when valid and matching", () => {
    expect(validateNewPassword("secret1", "secret1")).toBeNull();
  });

  it("flags the password field when too short", () => {
    const result = validateNewPassword("abc", "abc");
    expect(result?.field).toBe("password");
  });

  it("flags the confirm field on mismatch", () => {
    const result = validateNewPassword("secret1", "secret2");
    expect(result?.field).toBe("confirm");
    expect(result?.message).toMatch(/do not match/i);
  });
});

describe("validateRecoveryCode", () => {
  it("accepts a code of the expected length", () => {
    expect(validateRecoveryCode("1".repeat(RECOVERY_CODE_LENGTH))).toBeNull();
  });

  it("preserves and accepts a leading zero", () => {
    const code = "0".repeat(RECOVERY_CODE_LENGTH);
    expect(validateRecoveryCode(code)).toBeNull();
  });

  it("rejects an empty code", () => {
    expect(validateRecoveryCode("")).toMatch(
      new RegExp(`${RECOVERY_CODE_LENGTH}-digit`)
    );
  });

  it("rejects non-numeric characters", () => {
    expect(validateRecoveryCode("12ab5678")).toMatch(/numbers only/i);
  });

  it("rejects a wrong-length code", () => {
    expect(validateRecoveryCode("123")).toMatch(
      new RegExp(`${RECOVERY_CODE_LENGTH} digits long`)
    );
  });

  it("honours a custom expected length", () => {
    expect(validateRecoveryCode("123456", 6)).toBeNull();
    expect(validateRecoveryCode("12345678", 6)).toMatch(/6 digits long/);
  });
});

describe("describeAuthError", () => {
  it("maps invalid_credentials to friendly wording", () => {
    const msg = describeAuthError({
      name: "AuthApiError",
      message: "Invalid login credentials",
      code: "invalid_credentials",
    } as never);
    expect(msg).toMatch(/do not match an account/i);
  });

  it("maps an already-registered email", () => {
    const msg = describeAuthError({
      name: "AuthApiError",
      message: "User already registered",
      code: "user_already_exists",
    } as never);
    expect(msg).toMatch(/already exists/i);
  });

  it("recognises unconfirmed email", () => {
    const msg = describeAuthError({
      name: "AuthApiError",
      message: "Email not confirmed",
      code: "email_not_confirmed",
    } as never);
    expect(msg).toMatch(/confirm your email/i);
  });

  it("maps an expired/incorrect recovery code", () => {
    const msg = describeAuthError({
      name: "AuthApiError",
      message: "Token has expired or is invalid",
      code: "otp_expired",
    } as never);
    expect(msg).toMatch(/incorrect or has expired/i);
  });

  it("falls back to a safe generic message for null", () => {
    expect(describeAuthError(null)).toMatch(/something went wrong/i);
  });

  it("matches by message text when no code is present", () => {
    const msg = describeAuthError(new Error("Invalid login credentials"));
    expect(msg).toMatch(/do not match an account/i);
  });
});
