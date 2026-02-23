// components/Stepper.tsx
"use client";

import { useState } from "react";
import type { ProjectInput, SettingsV1 } from "@/lib/types";
import { Card, CardDesc, CardTitle } from "@/components/ui/Card";
import StepNav from "@/components/StepNav";
import Step1Project from "@/components/forms/Step1Project";
import Step2Soil from "@/components/forms/Step2Soil";
import Step3Leaf from "@/components/forms/Step3Leaf";
import Step4Prefs from "@/components/forms/Step4Prefs";
import Step5Prices from "@/components/forms/Step5Prices";

export default function Stepper({
  project,
  setProject,
  settings,
  setSettings,
  regions,
  crops,
  availability
}: {
  project: ProjectInput;
  setProject: (p: ProjectInput) => void;
  settings: SettingsV1;
  setSettings: (s: SettingsV1) => void;
  regions: string[];
  crops: string[];
  availability: { N: boolean; P: boolean; K: boolean };
}) {
  const [currentStep, setCurrentStep] = useState<number>(1);

  return (
    <div className="space-y-4">
      <Card>
        <CardTitle>Adımlar</CardTitle>
        <CardDesc>Soldan ilerle, sağdan canlı sonucu izle.</CardDesc>
        <div className="mt-3">
          <StepNav step={currentStep} setStep={setCurrentStep} />
        </div>
      </Card>

      {currentStep === 1 && (
        <Card>
          <CardTitle>STEP 1 — Proje Bilgileri</CardTitle>
          <div className="mt-3">
            <Step1Project
              project={project}
              setProject={setProject}
              settings={settings}
              regions={regions}
              crops={crops}
              availability={availability}
            />
          </div>
        </Card>
      )}

      {currentStep === 2 && (
        <Card>
          <CardTitle>STEP 2 — Toprak Analizi</CardTitle>
          <div className="mt-3">
            <Step2Soil project={project} setProject={setProject} settings={settings} />
          </div>
        </Card>
      )}

      {currentStep === 3 && (
        <Card>
          <CardTitle>STEP 3 — Bitki Analizi (Opsiyonel)</CardTitle>
          <div className="mt-3">
            <Step3Leaf project={project} setProject={setProject} />
          </div>
        </Card>
      )}

      {currentStep === 4 && (
        <Card>
          <CardTitle>STEP 4 — Tercihler</CardTitle>
          <div className="mt-3">
            <Step4Prefs project={project} setProject={setProject} settings={settings} />
          </div>
        </Card>
      )}

      {currentStep === 5 && (
        <Card>
          <CardTitle>STEP 5 — Fiyatlar (Maliyet)</CardTitle>
          <div className="mt-3">
            <Step5Prices project={project} setProject={setProject} settings={settings} />
          </div>
        </Card>
      )}

      <Card>
        <CardTitle>STEP 6 — Sonuç + PDF</CardTitle>
        <CardDesc>Sağ panelde detaylar ve PDF indirme var.</CardDesc>
      </Card>
    </div>
  );
}
