import { useState } from "react";
import { useAtom } from "jotai";
import { contactsAtom } from "@/atoms/contactsAtom";
import type { Contact } from "@/types/contact";
import { useForm, useStore } from "@tanstack/react-form";
import type { AnyFieldApi } from "@tanstack/react-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { Loader2, Search, Check } from "lucide-react";
import { useEnsAddress } from "wagmi";
import { normalize } from "viem/ens";
import type { Address } from "viem";
import QrScannerButton from "@/components/qr-scanner-button";

export default function AddContactForm() {
  const [contacts, setContacts] = useAtom(contactsAtom);
  const existingAddresses = contacts.map((c) => c.address.toLowerCase());
  const [isAdded, setIsAdded] = useState(false);

  const form = useForm({
    defaultValues: {
      name: "",
      address: "",
      chain: "",
      tags: "",
      version: "0.0.1",
      note: "",
    },
    onSubmit: async ({ value }) => {
      const resolvedAddress = value.address.endsWith(".eth")
        ? (ensAddress as string) ?? value.address.trim()
        : value.address.trim();
      const contact: Contact = {
        id: crypto.randomUUID(),
        name: value.name.trim(),
        address: resolvedAddress,
        chain: value.chain.trim() ? Number(value.chain.trim()) : null,
        metadata: {
          tags: value.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          version: value.version.trim(),
          note: value.note.trim(),
        },
      };
      setContacts((prev) => [...prev, contact]);
      form.reset();
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 2000);
    },
  });

  // watch address field for ENS resolution
  const addressValue = useStore(
    form.store,
    (state) => state.values.address || ""
  );

  const {
    data: ensAddress,
    isLoading: isLoadingEnsAddress,
    isError: isErrorEnsAddress,
    refetch: refetchEnsAddress,
  } = useEnsAddress({
    chainId: 1,
    name:
      addressValue &&
      addressValue.endsWith(".eth") &&
      addressValue.split(".")[0] !== ""
        ? normalize(addressValue)
        : undefined,
    query: { enabled: false },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      <div className="flex flex-col gap-2">
        {/* name */}
        <form.Field
          name="name"
          validators={{
            onChange: ({ value }) =>
              !value.trim() ? "Vui lòng nhập tên" : undefined,
          }}
        >
          {(field) => (
            <div className="flex flex-col gap-1">
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                className="rounded-none border-primary"
                placeholder="Tên"
                required
              />
              <FieldInfo field={field} placeholder="Vui lòng nhập tên" />
            </div>
          )}
        </form.Field>

        {/* address */}
        <form.Field
          name="address"
          validators={{
            onChange: ({ value }) => {
              if (!value.trim()) return "Vui lòng nhập địa chỉ";
              if (existingAddresses.includes(value.trim().toLowerCase()))
                return "Địa chỉ đã có trong danh bạ";
              return undefined;
            },
          }}
        >
          {(field) => (
              <div className="flex flex-col gap-1">
                <InputGroup className="border-primary">
                  <InputGroupInput
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Địa chỉ (0x...) hoặc ENS (.eth)"
                    className="text-base"
                    required
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton
                      type="button"
                      onClick={() => refetchEnsAddress()}
                      title="Tra cứu ENS"
                      className="hover:cursor-pointer"
                    >
                      {isLoadingEnsAddress ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Search className="w-3.5 h-3.5" />
                      )}
                    </InputGroupButton>
                    <QrScannerButton onScan={(address) => field.handleChange(address)} />
                  </InputGroupAddon>
                </InputGroup>
                <AddressFieldInfo
                  field={field}
                  ensAddress={ensAddress}
                  isLoadingEnsAddress={isLoadingEnsAddress}
                  isErrorEnsAddress={isErrorEnsAddress}
                />
              </div>
            )}
        </form.Field>

        {/* chain (optional) */}
        <form.Field
          name="chain"
          validators={{
            onChange: ({ value }) => {
              if (value.trim() && isNaN(Number(value.trim())))
                return "Chain phải là chain ID dạng số";
              return undefined;
            },
          }}
        >
          {(field) => (
            <div className="flex flex-col gap-1">
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                className="rounded-none"
                placeholder="Chain ID (không bắt buộc, vd: 1)"
                type="number"
              />
              <FieldInfo field={field} placeholder="Không bắt buộc — để trống nếu dùng cho mọi chain" />
            </div>
          )}
        </form.Field>

        {/* tags */}
        <form.Field name="tags">
          {(field) => (
            <Input
              id={field.name}
              name={field.name}
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              className="rounded-none"
              placeholder="Thẻ (phân tách bằng dấu phẩy, vd: defi, team)"
            />
          )}
        </form.Field>

        {/* note */}
        <form.Field name="note">
          {(field) => (
            <Input
              id={field.name}
              name={field.name}
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              className="rounded-none"
              placeholder="Ghi chú (không bắt buộc)"
            />
          )}
        </form.Field>

        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
        >
          {([canSubmit, isSubmitting]) => (
            <div className="flex flex-row gap-2">
              <Button
                className="hover:cursor-pointer rounded-none"
                type="submit"
                disabled={!canSubmit || isSubmitting || isAdded}
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isAdded ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <>Thêm</>
                )}
              </Button>
              <Button
                type="reset"
                variant="outline"
                className="hover:cursor-pointer rounded-none"
                onClick={(e) => {
                  e.preventDefault();
                  form.reset();
                }}
              >
                Đặt lại
              </Button>
            </div>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
}

// ── AddressFieldInfo ──────────────────────────────────────────────────────────

function AddressFieldInfo({
  field,
  ensAddress,
  isLoadingEnsAddress,
  isErrorEnsAddress,
}: {
  field: AnyFieldApi;
  ensAddress?: Address | null;
  isLoadingEnsAddress?: boolean;
  isErrorEnsAddress?: boolean;
}) {
  return (
    <>
      {!field.state.meta.isTouched ? (
        <em>Vui lòng nhập địa chỉ hoặc ENS</em>
      ) : field.state.meta.isTouched && !field.state.meta.isValid ? (
        <em
          className={
            field.state.meta.errors.join(",") === "Vui lòng nhập địa chỉ"
              ? ""
              : "text-red-400"
          }
        >
          {field.state.meta.errors.join(",")}
        </em>
      ) : isLoadingEnsAddress ? (
        <Skeleton className="w-10 h-4" />
      ) : isErrorEnsAddress ? (
        <div className="text-red-400 text-xs">Không thể phân giải ENS</div>
      ) : ensAddress ? (
        <em className="text-green-500 text-xs">{ensAddress}</em>
      ) : ensAddress === null ? (
        <div className="text-red-400 text-xs">ENS không hợp lệ</div>
      ) : (
        <em className="text-green-500">hợp lệ!</em>
      )}
      {field.state.meta.isValidating ? "Đang kiểm tra..." : null}
    </>
  );
}

// ── FieldInfo ─────────────────────────────────────────────────────────────────

function FieldInfo({
  field,
  placeholder,
}: {
  field: AnyFieldApi;
  placeholder: string;
}) {
  return (
    <>
      {!field.state.meta.isTouched ? (
        <em>{placeholder}</em>
      ) : field.state.meta.isTouched && !field.state.meta.isValid ? (
        <em
          className={
            field.state.meta.errors.join(",") === placeholder
              ? ""
              : "text-red-400"
          }
        >
          {field.state.meta.errors.join(",")}
        </em>
      ) : (
        <em className="text-green-500">hợp lệ!</em>
      )}
      {field.state.meta.isValidating ? "Đang kiểm tra..." : null}
    </>
  );
}
