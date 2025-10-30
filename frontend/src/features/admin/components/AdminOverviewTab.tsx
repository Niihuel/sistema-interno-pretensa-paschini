import { useNavigate } from 'react-router-dom';
import { Settings } from 'lucide-react';
import Button from '../../../shared/components/ui/Button';

export default function AdminOverviewTab() {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-[500px]">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
          <Settings className="w-10 h-10 text-white/40" />
        </div>

        <h2 className="text-2xl font-bold text-white mb-3">
          Configura tu Dashboard aquí
        </h2>

        <p className="text-white/60 mb-8">
          Personaliza tu panel de control con widgets y métricas relevantes para tu gestión
        </p>

        <Button
          onClick={() => navigate('/admin/dashboard')}
          variant="glass"
          className="px-6 py-3"
        >
          <Settings className="w-4 h-4 mr-2" />
          Ir a Configuración
        </Button>
      </div>
    </div>
  );
}
