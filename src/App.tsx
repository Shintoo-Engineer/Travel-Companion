/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { POPULAR_DESTINATIONS } from './data/offlinePacks';
import { DestinationInfo, TravelVaultData, TripPlan } from './types';
import { Navbar, NavTab } from './components/Navbar';
import { CompanionChat } from './components/CompanionChat';
import { TripPlannerView } from './components/TripPlannerView';
import { WhereNowView } from './components/WhereNowView';
import { LanguageCompanionView } from './components/LanguageCompanionView';
import { FoodCompanionView } from './components/FoodCompanionView';
import { CameraIntelligenceView } from './components/CameraIntelligenceView';
import { TransportCompanionView } from './components/TransportCompanionView';
import { MoneyCompanionView } from './components/MoneyCompanionView';
import { EmergencyCenterView } from './components/EmergencyCenterView';
import { OfflinePackManager } from './components/OfflinePackManager';
import { TravelMemoryVault } from './components/TravelMemoryVault';
import { OfflineIndicator } from './components/OfflineIndicator';
import { LiveVoiceCompanion } from './components/LiveVoiceCompanion';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('chat');
  const [isVoiceCallOpen, setIsVoiceCallOpen] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState<DestinationInfo>(
    POPULAR_DESTINATIONS[0] // Vietnam by default as highlighted in the user brief!
  );

  const [vaultData, setVaultData] = useState<TravelVaultData>(() => {
    try {
      const stored = localStorage.getItem('travel_vault_data');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      // ignore
    }
    return {
      travelerName: 'Alex Traveler',
      passportNumber: 'N78945612',
      emergencyContactName: 'Mom & Family',
      emergencyContactPhone: '+91 98765 43210',
      hotelName: 'Hanoi Heritage Boutique Hotel',
      hotelAddress: '15 Hang Gai Street, Hoan Kiem District, Hanoi',
      roomNumber: '304',
      flightDetails: 'VN 382 / Gate 4B',
      insurancePolicyNumber: 'TRV-9988-771',
      dietaryNotes: 'Pure Vegetarian (No meat, no poultry, no fish sauce)',
    };
  });

  const handleSavePlanToVault = (plan: TripPlan) => {
    try {
      localStorage.setItem(`saved_trip_${selectedDestination.id}`, JSON.stringify(plan));
    } catch (e) {
      console.warn(e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-sky-500/30 selection:text-sky-200">
      {/* Top Main Navigation Bar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        selectedDestination={selectedDestination}
        onSelectDestination={setSelectedDestination}
        onOpenVoiceCall={() => setIsVoiceCallOpen(true)}
      />

      {/* Main Dynamic Viewport Container */}
      <main className="flex-1 overflow-x-hidden pb-12">
        {currentTab === 'chat' && (
          <CompanionChat
            destination={selectedDestination}
            vault={vaultData}
            onNavigateTab={setCurrentTab}
            onOpenVoiceCall={() => setIsVoiceCallOpen(true)}
          />
        )}

        {currentTab === 'planner' && (
          <TripPlannerView
            destination={selectedDestination}
            vault={vaultData}
            onSaveToVault={handleSavePlanToVault}
          />
        )}

        {currentTab === 'wherenow' && (
          <WhereNowView destination={selectedDestination} />
        )}

        {currentTab === 'language' && (
          <LanguageCompanionView destination={selectedDestination} />
        )}

        {currentTab === 'food' && (
          <FoodCompanionView destination={selectedDestination} />
        )}

        {currentTab === 'vision' && (
          <CameraIntelligenceView destination={selectedDestination} />
        )}

        {currentTab === 'transport' && (
          <TransportCompanionView destination={selectedDestination} />
        )}

        {currentTab === 'money' && (
          <MoneyCompanionView destination={selectedDestination} />
        )}

        {currentTab === 'emergency' && (
          <EmergencyCenterView
            destination={selectedDestination}
            vault={vaultData}
          />
        )}

        {currentTab === 'offline' && (
          <OfflinePackManager
            currentDestination={selectedDestination}
            onSelectDestination={setSelectedDestination}
          />
        )}

        {currentTab === 'vault' && (
          <TravelMemoryVault
            destination={selectedDestination}
            vaultData={vaultData}
            onUpdateVault={setVaultData}
          />
        )}
      </main>

      {/* Floating Offline Connectivity Indicator */}
      <OfflineIndicator />

      {/* Live Voice Call Companion Modal */}
      <LiveVoiceCompanion
        destination={selectedDestination}
        vault={vaultData}
        isOpen={isVoiceCallOpen}
        onClose={() => setIsVoiceCallOpen(false)}
      />
    </div>
  );
}
