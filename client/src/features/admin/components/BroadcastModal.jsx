import React, { useState } from "react";
import Modal from "@/shared/ui/Modal";
import Input from "@/shared/ui/Input";
import TextArea from "@/shared/ui/TextArea";
import Button from "@/shared/ui/Button";
import Alert from "@/shared/ui/Alert";
import { Send } from "lucide-react";
import { adminApi } from "@/features/admin/api/adminApi";

export default function BroadcastModal({ isOpen, onClose }) {
  const [broadcastData, setBroadcastData] = useState({
    title: "",
    message: "",
    link: "",
  });
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!broadcastData.title.trim() || !broadcastData.message.trim()) return;

    setSending(true);
    setStatus(null);
    try {
      const res = await adminApi.sendBroadcast(broadcastData);
      setStatus({
        type: "success",
        msg: res.message || "Розсилку успішно надіслано всім користувачам!",
      });
      setBroadcastData({ title: "", message: "", link: "" });
      setTimeout(() => {
        onClose();
        setStatus(null);
      }, 1500);
    } catch (err) {
      setStatus({
        type: "danger",
        msg: err.response?.data?.error || "Помилка при надсиланні розсилки",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Системна розсилка сповіщень та Email"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {status && <Alert variant={status.type}>{status.msg}</Alert>}

        <Input
          label="Заголовок сповіщення"
          placeholder="Наприклад: Оновлення платформи або технічні роботи"
          value={broadcastData.title}
          onChange={(e) =>
            setBroadcastData((prev) => ({ ...prev, title: e.target.value }))
          }
          required
        />

        <TextArea
          label="Текст повідомлення"
          placeholder="Введіть текст, який отримають усі користувачі в особистому кабінеті та на Email..."
          rows={4}
          value={broadcastData.message}
          onChange={(e) =>
            setBroadcastData((prev) => ({ ...prev, message: e.target.value }))
          }
          required
        />

        <Input
          label="Посилання (опціонально)"
          placeholder="/programs або https://..."
          value={broadcastData.link}
          onChange={(e) =>
            setBroadcastData((prev) => ({ ...prev, link: e.target.value }))
          }
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Скасувати
          </Button>
          <Button
            type="submit"
            variant="primary"
            icon={Send}
            isLoading={sending}
          >
            Надіслати всім
          </Button>
        </div>
      </form>
    </Modal>
  );
}
