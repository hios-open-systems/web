"use client";

import { useState } from "react";
import { Button, Modal } from "antd";
import { DownloadOutlined, EyeOutlined } from "@ant-design/icons";
import { useTranslations } from "next-intl";
import { StlViewerLazy } from "@/components/prints/StlViewerLazy";

export function ProjectStlPreview({
  url,
  name,
}: {
  url: string;
  name: string;
}) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("ProjectDetail");

  return (
    <>
      <Button size="small" icon={<EyeOutlined />} onClick={() => setOpen(true)}>
        {t("view_3d")}
      </Button>
      <Modal
        open={open}
        title={name}
        onCancel={() => setOpen(false)}
        width={960}
        centered
        destroyOnHidden
        footer={
          <Button icon={<DownloadOutlined />} href={url} download>
            {t("download")}
          </Button>
        }
      >
        <div
          style={{
            position: "relative",
            height: "min(65vh, 600px)",
            minHeight: 320,
          }}
        >
          {open && <StlViewerLazy url={url} name={name} />}
        </div>
      </Modal>
    </>
  );
}
