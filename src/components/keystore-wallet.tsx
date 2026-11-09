import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "@tanstack/react-form";
import type { AnyFieldApi } from "@tanstack/react-form";
import { Loader2 } from "lucide-react";
import { Keystore, Bytes } from "ox";
import type { UmKeystore } from "@/types/wallet";
import { mnemonicToAccount } from "viem/accounts";
import { Textarea } from "@/components/ui/textarea";
import CopyButton from "@/components/copy-button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function KeystoreWallet() {
  const [outputBackupKeystore, setOutputBackupKeystore] =
    useState<UmKeystore | null>(null);

  const [outputDecryptedMnemonicPhrase, setOutputDecryptedMnemonicPhrase] =
    useState<string | null>(null);

  // backup any mnemonic/seed phrase
  const anySeedPhraseBackupForm = useForm({
    defaultValues: {
      name: "",
      mnemonicPhrase: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      // Derive the address from the seed phrase.
      const address = mnemonicToAccount(value.mnemonicPhrase).address;

      // Convert the mnemonic phrase to bytes.
      const mnemonicBytes = Bytes.fromString(value.mnemonicPhrase);

      // Derive the key using the provided password.
      const [key, opts] = Keystore.pbkdf2({ password: value.password });

      // Encrypt the mnemonic phrase.
      const encrypted = Keystore.encrypt(mnemonicBytes, key, opts);

      // Add the metadata to the encrypted keystore.
      const encryptedWithMeta = {
        ...encrypted,
        meta: {
          type: "secret-phrase",
          note: "the 12 words secret phrase (aka mnemonic phrase) is encrypted with the password using the keystore encryption process",
        },
        name: value.name,
        address: address,
      } as UmKeystore;

      // Set the output backup keystore.
      setOutputBackupKeystore(encryptedWithMeta);
      // Reset the form.
      anySeedPhraseBackupForm.reset();
    },
  });

  // decrypt any keystore
  const anySeedPhraseDecryptForm = useForm({
    defaultValues: {
      keystore: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      // Parse the keystore.
      const keystore = JSON.parse(value.keystore);
      
      // Derive the key using your password.
      const key = Keystore.toKey(keystore, { password: value.password })
      
      // Decrypt the private key.
      const mnemonicBytes = Keystore.decrypt(keystore, key);

      const mnemonicPhrase = Bytes.toString(Bytes.fromHex(mnemonicBytes));

      // Set the output decrypted mnemonic phrase.
      setOutputDecryptedMnemonicPhrase(mnemonicPhrase);
    },
  });

  // download the backup keystore
  function downloadBackupKeystore() {
    const blob = new Blob([JSON.stringify(outputBackupKeystore, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${outputBackupKeystore?.name.replace(
      / /g,
      "-"
    )}-DO_NOT_DELETE.json`;
    a.click();
  }

  // clear the backup keystore
  function clearBackupKeystore() {
    setOutputBackupKeystore(null);
  }

  // clear the decrypted mnemonic phrase
  function clearDecryptedMnemonicPhrase() {
    setOutputDecryptedMnemonicPhrase(null);
  }

  return (
    <div className="flex flex-col border-2 border-primary gap-2 pb-8 h-fit">
      <div className="flex flex-row justify-between items-center bg-primary text-secondary pl-1">
        <h1 className="text-md font-bold">Keystore</h1>
      </div>
      <div className="flex flex-col gap-4 px-4 py-2">
        <Tabs defaultValue="encrypt" className="w-full">
          <TabsList className="border-primary border rounded-none">
            <TabsTrigger className="rounded-none" value="encrypt">
              Mã hóa
            </TabsTrigger>
            <TabsTrigger className="rounded-none" value="decrypt">
              Giải mã
            </TabsTrigger>
          </TabsList>
          <TabsContent value="encrypt" className="flex flex-col gap-2">
            <p className="text-muted-foreground text-xs">Chuyển bất kỳ cụm từ khôi phục nào thành keystore</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                anySeedPhraseBackupForm.handleSubmit();
              }}
            >
              <div className="flex flex-col gap-2">
                <anySeedPhraseBackupForm.Field
                  name="name"
                  validators={{
                    onChange: ({ value }) =>
                      !value ? "Vui lòng nhập tên" : undefined,
                  }}
                >
                  {(field) => (
                    <div className="flex flex-col gap-2">
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value || ""}
                        onChange={(e) => field.handleChange(e.target.value)}
                        type="text"
                        placeholder="Tên ví"
                        className="rounded-none border-primary text-base"
                        required
                      />
                      <NameFieldInfo field={field} />
                    </div>
                  )}
                </anySeedPhraseBackupForm.Field>
                <anySeedPhraseBackupForm.Field
                  name="password"
                  validators={{
                    onChange: ({ value }) =>
                      !value ? "Vui lòng nhập mật khẩu" : undefined,
                  }}
                >
                  {(field) => (
                    <div className="flex flex-col gap-2">
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value || ""}
                        onChange={(e) => field.handleChange(e.target.value)}
                        type="password"
                        placeholder="Mật khẩu mạnh"
                        className="rounded-none border-primary text-base"
                        required
                      />
                      <PasswordFieldInfo field={field} />
                    </div>
                  )}
                </anySeedPhraseBackupForm.Field>
                <anySeedPhraseBackupForm.Field
                  name="mnemonicPhrase"
                  validators={{
                    onChange: ({ value }) =>
                      !value ? "Vui lòng nhập cụm từ khôi phục" : undefined,
                  }}
                >
                  {(field) => (
                    <div className="flex flex-col gap-2">
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value || ""}
                        onChange={(e) => field.handleChange(e.target.value)}
                        type="text"
                        placeholder="Cụm từ khôi phục"
                        className="rounded-none border-primary text-base"
                        required
                      />
                      <MnemonicPhraseFieldInfo field={field} />
                    </div>
                  )}
                </anySeedPhraseBackupForm.Field>
                <anySeedPhraseBackupForm.Subscribe
                  selector={(state) => [state.canSubmit, state.isSubmitting]}
                >
                  {([canSubmit, isSubmitting]) => (
                    <div className="flex flex-row gap-2">
                      <Button
                        className="hover:cursor-pointer rounded-none"
                        type="submit"
                        disabled={!canSubmit || isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                          </>
                        ) : (
                          <>Sao lưu</>
                        )}
                      </Button>
                      <Button
                        type="reset"
                        variant="outline"
                        onClick={(e) => {
                          // Avoid unexpected resets of form elements (especially <select> elements)
                          e.preventDefault();
                          anySeedPhraseBackupForm.reset();
                        }}
                        className="hover:cursor-pointer rounded-none border-secondary"
                      >
                        Đặt lại
                      </Button>
                    </div>
                  )}
                </anySeedPhraseBackupForm.Subscribe>
              </div>
            </form>
            <div className="flex flex-col gap-2">
              {outputBackupKeystore ? (
                <div className="flex flex-col gap-2">
                  <p>
                    Sao chép và lưu keystore sao lưu dưới đây ở nơi an toàn.
                  </p>
                  <div className="flex flex-row gap-2">
                    <CopyButton
                      text={JSON.stringify(outputBackupKeystore, null, 2)}
                      variant="outline"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={downloadBackupKeystore}
                      className="hover:cursor-pointer rounded-none border-secondary"
                    >
                      Tải xuống
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={clearBackupKeystore}
                      className="hover:cursor-pointer rounded-none border-secondary"
                    >
                      Đặt lại
                    </Button>
                  </div>
                  <Textarea
                    value={JSON.stringify(outputBackupKeystore, null, 2)}
                    className="rounded-none border-primary"
                    readOnly
                    rows={10}
                  />
                </div>
              ) : (
                <p>Chưa có keystore sao lưu</p>
              )}
            </div>
          </TabsContent>
          <TabsContent value="decrypt" className="flex flex-col gap-2">
            <p className="text-muted-foreground text-xs">Giải mã bất kỳ keystore nào thành cụm từ khôi phục</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                anySeedPhraseDecryptForm.handleSubmit();
              }}
            >
              <div className="flex flex-col gap-2">
                <anySeedPhraseDecryptForm.Field
                  name="keystore"
                  validators={{
                    onChange: ({ value }) =>
                      !value ? "Vui lòng nhập cụm từ khôi phục" : undefined,
                  }}
                >
                  {(field) => (
                    <div className="flex flex-col gap-2">
                      <Textarea
                        id={field.name}
                        name={field.name}
                        value={field.state.value || ""}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Keystore"
                        className="rounded-none border-primary"
                        required
                      />
                      <KeystoreFieldInfo field={field} />
                    </div>
                  )}
                </anySeedPhraseDecryptForm.Field>
                <anySeedPhraseDecryptForm.Field
                  name="password"
                  validators={{
                    onChange: ({ value }) =>
                      !value ? "Vui lòng nhập mật khẩu" : undefined,
                  }}
                >
                  {(field) => (
                    <div className="flex flex-col gap-2">
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value || ""}
                        onChange={(e) => field.handleChange(e.target.value)}
                        type="password"
                        placeholder="Mật khẩu"
                        className="rounded-none border-primary"
                        required
                      />
                      <PasswordFieldInfo field={field} />
                    </div>
                  )}
                </anySeedPhraseDecryptForm.Field>
                <anySeedPhraseDecryptForm.Subscribe
                  selector={(state) => [state.canSubmit, state.isSubmitting]}
                >
                  {([canSubmit, isSubmitting]) => (
                    <div className="flex flex-row gap-2">
                      <Button
                        className="hover:cursor-pointer rounded-none"
                        type="submit"
                        disabled={!canSubmit || isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                          </>
                        ) : (
                          <>Giải mã</>
                        )}
                      </Button>
                      <Button
                        type="reset"
                        variant="outline"
                        onClick={(e) => {
                          // Avoid unexpected resets of form elements (especially <select> elements)
                          e.preventDefault();
                          anySeedPhraseDecryptForm.reset();
                        }}
                        className="hover:cursor-pointer rounded-none border-secondary"
                      >
                        Đặt lại
                      </Button>
                    </div>
                  )}
                </anySeedPhraseDecryptForm.Subscribe>
              </div>
            </form>
            <div className="flex flex-col gap-2">
              {outputDecryptedMnemonicPhrase ? (
                <div className="flex flex-col gap-2">
                  <p>
                    Sao chép và lưu cụm từ khôi phục dưới đây ở nơi an toàn.
                  </p>
                  <div className="flex flex-row gap-2">
                    <CopyButton
                      text={outputDecryptedMnemonicPhrase}
                      variant="outline"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={clearDecryptedMnemonicPhrase}
                      className="hover:cursor-pointer rounded-none border-secondary"
                    >
                      Đặt lại
                    </Button>
                  </div>
                  <Textarea
                    value={outputDecryptedMnemonicPhrase}
                    className="rounded-none border-primary"
                    readOnly
                    rows={10}
                  />
                </div>
              ) : (
                <p>Chưa có cụm từ khôi phục đã giải mã</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function NameFieldInfo({ field }: { field: AnyFieldApi }) {
  return (
    <>
      {!field.state.meta.isTouched ? (
        <em>Vui lòng nhập tên</em>
      ) : field.state.meta.isTouched && !field.state.meta.isValid ? (
        <em
          className={`${
            field.state.meta.errors.join(",") === "Vui lòng nhập tên"
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

function PasswordFieldInfo({ field }: { field: AnyFieldApi }) {
  return (
    <>
      {!field.state.meta.isTouched ? (
        <em>Vui lòng nhập mật khẩu</em>
      ) : field.state.meta.isTouched && !field.state.meta.isValid ? (
        <em
          className={`${
            field.state.meta.errors.join(",") === "Vui lòng nhập mật khẩu"
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

function MnemonicPhraseFieldInfo({ field }: { field: AnyFieldApi }) {
  return (
    <>
      {!field.state.meta.isTouched ? (
        <em>Vui lòng nhập cụm từ khôi phục</em>
      ) : field.state.meta.isTouched && !field.state.meta.isValid ? (
        <em
          className={`${
            field.state.meta.errors.join(",") ===
            "Vui lòng nhập cụm từ khôi phục"
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


function KeystoreFieldInfo({ field }: { field: AnyFieldApi }) {
  return (
    <>
      {!field.state.meta.isTouched ? (
        <em>Vui lòng nhập keystore</em>
      ) : field.state.meta.isTouched && !field.state.meta.isValid ? (
        <em
          className={`${
            field.state.meta.errors.join(",") === "Vui lòng nhập keystore"
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