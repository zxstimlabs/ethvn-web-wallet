import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import type { AnyFieldApi } from "@tanstack/react-form";
import { useAtomValue } from "jotai";
import type { UmKeystore } from "@/types/wallet";
import { walletsAtom } from "@/atoms/walletsAtom";
import { activeWalletAtom } from "@/atoms/activeWalletAtom";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Keystore, Bytes } from "ox";
import CopyButton from "@/components/copy-button";

export default function ExportWallet() {
  const wallets = useAtomValue<Array<UmKeystore>>(walletsAtom);
  const activeWallet = useAtomValue<UmKeystore | null>(activeWalletAtom);
  const [exportedSecretPhrase, setExportedSecretPhrase] = useState<
    string | null
  >(null);
  const [showPassword, setShowPassword] = useState(false);

  function downloadAllKeystores() {
    const blob = new Blob([JSON.stringify(wallets, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `unitmetal-wallets-DO_NOT_DELETE.json`;
    a.click();
  }

  function downloadActiveKeystore() {
    const blob = new Blob([JSON.stringify(activeWallet, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeWallet?.name.replace(/ /g, "-")}-DO_NOT_DELETE.json`;
    a.click();
  }

  const exportActiveWalletForm = useForm({
    defaultValues: {
      password: "",
    },
    onSubmit: async ({ value }) => {
      // Parse the keystore.
      const keystore = activeWallet;

      // Derive the key using your password.
      const key = Keystore.toKey(keystore as Keystore.Keystore, {
        password: value.password,
      });

      // Decrypt the private key.
      const mnemonicBytes = Keystore.decrypt(
        keystore as Keystore.Keystore,
        key
      );

      const mnemonicPhrase = Bytes.toString(Bytes.fromHex(mnemonicBytes));

      // Set the output decrypted mnemonic phrase.
      setExportedSecretPhrase(mnemonicPhrase);

      // Reset the form.
      exportActiveWalletForm.reset();
    },
  });

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-2">
        <h3 className="text-md text-muted-foreground">
          {activeWallet
            ? `Tải keystore sao lưu của ví hiện tại`
            : "Chọn một ví để tải keystore sao lưu"}
        </h3>
        <Button
          onClick={downloadActiveKeystore}
          size="sm"
          className="w-fit rounded-none hover:cursor-pointer"
          disabled={!activeWallet}
        >
          Tải xuống
        </Button>
        <div className="border-t-2 border-primary border-dotted" />
        <h3 className="text-md text-muted-foreground">
          Tải keystore sao lưu của tất cả các ví
        </h3>
        <Button
          onClick={downloadAllKeystores}
          size="sm"
          className="w-fit rounded-none hover:cursor-pointer"
        >
          Tải xuống
        </Button>
        <div className="border-t-2 border-primary border-dotted" />
        <h3 className="text-md text-muted-foreground">
          {activeWallet
            ? "Xuất và hiển thị cụm từ bí mật của ví hiện tại"
            : "Chọn một ví để xuất và hiển thị cụm từ bí mật"}
        </h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            exportActiveWalletForm.handleSubmit();
          }}
        >
          <div className="flex flex-col gap-2">
            <exportActiveWalletForm.Field
              name="password"
              validators={{
                onChange: ({ value }) =>
                  !value ? "Vui lòng nhập mật khẩu" : undefined,
              }}
            >
              {(field) => (
                <div className="flex flex-col gap-2">
                  <InputGroup className="border-primary">
                    <InputGroupInput
                      id={field.name}
                      name={field.name}
                      value={field.state.value || ""}
                      onChange={(e) => field.handleChange(e.target.value)}
                      type={showPassword ? "text" : "password"}
                      placeholder="Mật khẩu"
                      className="text-base"
                      required
                    />
                    <InputGroupAddon align="inline-end">
                      <InputGroupButton
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="hover:cursor-pointer"
                      >
                        {showPassword ? (
                          <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                      </InputGroupButton>
                    </InputGroupAddon>
                  </InputGroup>
                  <PasswordFieldInfo field={field} />
                </div>
              )}
            </exportActiveWalletForm.Field>
            <exportActiveWalletForm.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
            >
              {([canSubmit, isSubmitting]) => (
                <div className="flex flex-row gap-2">
                  <Button
                    size="sm"
                    className="hover:cursor-pointer rounded-none"
                    type="submit"
                    disabled={!canSubmit || isSubmitting || !activeWallet}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </>
                    ) : (
                      <>Xuất</>
                    )}
                  </Button>
                  <Button
                    type="reset"
                    variant="outline"
                    onClick={(e) => {
                      // Avoid unexpected resets of form elements (especially <select> elements)
                      e.preventDefault();
                      exportActiveWalletForm.reset();
                      setExportedSecretPhrase("");
                    }}
                    className="hover:cursor-pointer rounded-none border-secondary"
                  >
                    Đặt lại
                  </Button>
                </div>
              )}
            </exportActiveWalletForm.Subscribe>
          </div>
        </form>
        <div className="flex flex-col gap-2">
          <Textarea
            value={exportedSecretPhrase || ""}
            placeholder="Cụm từ bí mật đã xuất"
            className="rounded-none border-primary text-base"
            readOnly
            rows={10}
          />
          <div className="self-end">
            <CopyButton text={exportedSecretPhrase || ""} variant="outline" />
          </div>
        </div>
      </div>
    </div>
  );
}

function PasswordFieldInfo({ field }: { field: AnyFieldApi }) {
  return (
    <>
      {!field.state.meta.isTouched ? (
        <em>Vui lòng nhập mật khẩu ví</em>
      ) : field.state.meta.isTouched && !field.state.meta.isValid ? (
        <em
          className={`${
            field.state.meta.errors.join(",") ===
            "Vui lòng nhập mật khẩu ví"
              ? ""
              : "text-red-400"
          }`}
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
