"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTimelineData = exports.calculateListProgress = exports.calculateOrganProgress = void 0;
/**
 * Counts the number of business days (Mon-Fri) between two dates.
 * @param startDate The start date.
 * @param endDate The end date (default: now).
 * @returns Number of business days.
 */
function countBusinessDays(startDate, endDate) {
    if (endDate === void 0) { endDate = new Date(); }
    var count = 0;
    var currentDate = new Date(startDate);
    // Normalize to start of day to avoid time discrepancies
    currentDate.setHours(0, 0, 0, 0);
    var end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    while (currentDate < end) {
        var dayOfWeek = currentDate.getDay();
        // 0 = Sunday, 6 = Saturday
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            count++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return count;
}
/**
 * proper pseudo-random generator to ensure deterministic results for the same inputs.
 * This ensures that for a given list ID/start date and organ, the "target duration" is always the same.
 */
function pseudoRandom(seed) {
    var x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}
var calculateOrganProgress = function (startDateStr, active, organIndex) {
    if (active)
        return 100;
    var startDate = new Date(startDateStr);
    var now = new Date();
    // Se a data de início for no futuro, o progresso é 0
    if (startDate > now)
        return 0;
    // 1. Determine "Target Days" (7 to 30 business days) deterministically
    // We use the timestamp of the start date + organ index as a seed
    var seed = startDate.getTime() + (organIndex * 12345);
    var randomFactor = pseudoRandom(seed); // 0.0 to 1.0
    // Range: 7 to 30 days
    var minDays = 7;
    var maxDays = 30;
    var targetBusinessDays = Math.floor(minDays + (randomFactor * (maxDays - minDays)));
    // 2. Count actual business days passed
    var businessDaysPassed = countBusinessDays(startDate, now);
    // 3. Calculate percentage based on target
    // If businessDaysPassed >= targetBusinessDays, we should be at 97% (waiting validation)
    // formula: (passed / target) * 97
    var progress = (businessDaysPassed / targetBusinessDays) * 97;
    // 4. Caps and Floors
    progress = Math.floor(progress);
    // Never exceed 97% automatically
    return Math.min(97, Math.max(0, progress));
};
exports.calculateOrganProgress = calculateOrganProgress;
var calculateListProgress = function (startDateStr, isManual, organs) {
    if (isManual)
        return 100;
    if (organs) {
        var totalOrgans = 5;
        var completedCount = Object.values(organs).filter(Boolean).length;
        // Se todos os órgãos estiverem baixados manualmente/confirmados, é 100%
        if (completedCount === totalOrgans)
            return 100;
        // Caso contrário, calculamos uma média dos progressos individuais
        var organKeys = ['serasa', 'boaVista', 'spc', 'cenprotNacional', 'cenprotSP'];
        var totalProgress = organKeys.reduce(function (acc, key, idx) {
            // Pass the index (0-4) to help randomize the timeline per organ
            return acc + (0, exports.calculateOrganProgress)(startDateStr, organs[key], idx);
        }, 0);
        var averageProgress = Math.floor(totalProgress / totalOrgans);
        return Math.min(97, Math.max(0, averageProgress));
    }
    // Fallback para quando não temos os órgãos (usado em partes genéricas)
    // Usa uma média "genérica" baseada em ~20 dias úteis
    var startDate = new Date(startDateStr);
    var now = new Date();
    var businessDaysPassed = countBusinessDays(startDate, now);
    var genericTarget = 20;
    var progress = Math.floor((businessDaysPassed / genericTarget) * 97);
    return Math.min(97, Math.max(0, progress));
};
exports.calculateListProgress = calculateListProgress;
var getTimelineData = function (startDateStr) {
    var start = new Date(startDateStr);
    // Default estimate of ~45 calendar days to be safe in the UI text (approx 30 business days)
    var end = new Date(start);
    end.setDate(start.getDate() + 45);
    var now = new Date();
    var daysPassed = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return {
        start: start.toLocaleDateString('pt-BR'),
        end: end.toLocaleDateString('pt-BR'), // Estimativa visual
        daysPassed: daysPassed
    };
};
exports.getTimelineData = getTimelineData;
