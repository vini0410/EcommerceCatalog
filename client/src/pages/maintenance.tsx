import React from 'react';

const MaintenancePage = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center p-8 bg-card rounded-lg shadow-lg">
        <h1 className="text-4xl font-bold text-foreground mb-4">Atualizando Produtos</h1>
        <p className="text-lg text-muted-foreground mb-6">
          Estamos atualizando os produtos. Em breve voltaremos com mais novidades!
        </p>
        <img
          src="/logo.png" // Assuming you have a logo in your public folder
          alt="Manutenção"
          className="mx-auto w-32 h-32 object-contain"
        />
      </div>
    </div>
  );
};

export default MaintenancePage;
