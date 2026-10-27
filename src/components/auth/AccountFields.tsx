"use client";

import { Field, inputCls } from "@/components/ui";

export interface AccountValues {
  email: string;
  password: string;
  passwordConfirm: string;
  name: string;
  phone: string;
}

export const emptyAccount: AccountValues = { email: "", password: "", passwordConfirm: "", name: "", phone: "" };

/** 클라이언트에서 먼저 확인할 수 있는 것만 검사. 이미 로그인한 계정(Google 등)으로 가입하면 비밀번호는 검사하지 않는다. */
export function validateAccount(values: AccountValues, withLinkedAccount = false): string {
  if (withLinkedAccount) return "";
  if (values.password.length < 8) return "비밀번호는 8자 이상이어야 해요.";
  if (values.password !== values.passwordConfirm) return "비밀번호 확인이 일치하지 않아요.";
  return "";
}

interface Props {
  values: AccountValues;
  onChange: (values: AccountValues) => void;
  nameLabel: string;
  namePlaceholder: string;
  withPhone?: boolean;
  /** 이미 로그인한 계정(Google 등)으로 가입 중이면 그 이메일 — 이메일·비밀번호 입력란 대신 보여준다. */
  linkedEmail?: string;
  onCancelLinked?: () => void;
}

export function AccountFields({
  values,
  onChange,
  nameLabel,
  namePlaceholder,
  withPhone = false,
  linkedEmail,
  onCancelLinked,
}: Props) {
  const set = (key: keyof AccountValues) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...values, [key]: e.target.value });

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {linkedEmail ? (
        <div className="flex items-center justify-between gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm ring-1 ring-emerald-200 sm:col-span-2">
          <span className="min-w-0 truncate text-emerald-800">
            ✓ <b>{linkedEmail}</b> 계정으로 가입해요
          </span>
          {onCancelLinked && (
            <button type="button" onClick={onCancelLinked} className="shrink-0 text-xs font-semibold text-zinc-500 hover:underline">
              다른 이메일로 가입
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="sm:col-span-2">
            <Field label="이메일">
              <input
                type="email"
                required
                autoComplete="email"
                value={values.email}
                onChange={set("email")}
                className={inputCls}
                placeholder="you@example.com"
              />
            </Field>
          </div>
          <Field label="비밀번호" hint="8자 이상">
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={values.password}
              onChange={set("password")}
              className={inputCls}
            />
          </Field>
          <Field label="비밀번호 확인">
            <input
              type="password"
              required
              autoComplete="new-password"
              value={values.passwordConfirm}
              onChange={set("passwordConfirm")}
              className={inputCls}
            />
          </Field>
        </>
      )}
      <Field label={nameLabel}>
        <input
          required
          maxLength={30}
          value={values.name}
          onChange={set("name")}
          className={inputCls}
          placeholder={namePlaceholder}
        />
      </Field>
      {withPhone && (
        <Field label="연락처">
          <input
            type="tel"
            required
            maxLength={20}
            autoComplete="tel"
            value={values.phone}
            onChange={set("phone")}
            className={inputCls}
            placeholder="010-1234-5678"
          />
        </Field>
      )}
    </div>
  );
}
