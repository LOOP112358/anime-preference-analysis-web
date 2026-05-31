"use client";

import { useEffect, useState } from "react";
import { fetchSiteVisitCount, recordSiteVisit } from "../lib/api";
import { DonateModal, FeedbackModal } from "./FooterSupportModals";

/** 同一次页面加载内去重（React Strict Mode 会双调 useEffect） */
let visitRecordPromise = null;

function loadVisitCount() {
  if (!visitRecordPromise) {
    visitRecordPromise = recordSiteVisit().catch(() => fetchSiteVisitCount());
  }
  return visitRecordPromise;
}

function FooterLink({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-xs text-stone-500 underline-offset-2 transition hover:text-moe-rose hover:underline"
    >
      {children}
    </button>
  );
}

export default function SiteFooter() {
  const [pageViews, setPageViews] = useState(null);
  const [failed, setFailed] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [donateOpen, setDonateOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    loadVisitCount()
      .then((count) => {
        if (!cancelled) {
          setPageViews(count);
          setFailed(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  let visitLabel = "本站访问量统计中…";
  if (pageViews != null) {
    visitLabel = `本站访问量 ${pageViews.toLocaleString("zh-CN")}`;
  } else if (failed) {
    visitLabel = "本站访问量暂不可用";
  }

  return (
    <>
      <footer className="relative z-10 mt-auto border-t border-stone-300/60 bg-paper/80 px-4 py-3 text-center">
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          <FooterLink onClick={() => setFeedbackOpen(true)}>意见反馈</FooterLink>
          <span className="text-xs text-stone-300" aria-hidden>
            ·
          </span>
          <FooterLink onClick={() => setDonateOpen(true)}>打赏支持</FooterLink>
        </div>
        <p className="mt-1.5 text-xs text-stone-400">{visitLabel}</p>
      </footer>

      <FeedbackModal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
      <DonateModal open={donateOpen} onClose={() => setDonateOpen(false)} />
    </>
  );
}
