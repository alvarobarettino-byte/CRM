export type Priority = 'Alta' | 'Media' | 'Baja';

export type StageId =
  | 'identificacion'
  | 'primer-contacto'
  | 'nda-firmado'
  | 'due-diligence'
  | 'loi-oferta'
  | 'negociacion'
  | 'cerrado'
  | 'descartado';

export interface Deal {
  id: string;
  company: string;
  sector: string;
  dealSize: number | null; // in €M
  evEbitda: number | null;
  contactName: string;
  contactEmail: string;
  assignedTo: string;
  priority: Priority;
  stageId: StageId;
  notes: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

export interface Stage {
  id: StageId;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  dotColor: string;
}
