# Product-Oriented Rules (Clocket)

Este documento define reglas de producto, marca y experiencia de usuario.
Se usa junto con:

- `/Users/argtobias/clocket-app/AGENTS.md`
- `/Users/argtobias/clocket-app/TecnicalAgents.md`

Si una propuesta es tecnicamente correcta pero rompe estas reglas de producto, no se acepta.

## 1. Product Identity

Clocket es una app de claridad financiera personal.

Clocket no es:

- un sistema contable profesional
- una plataforma financiera corporativa
- un reemplazo de banca tradicional
- un tablero de analitica financiera compleja

Clocket si es:

- una herramienta de claridad cotidiana
- una interfaz simple para entender el estado del dinero personal
- una experiencia de bajo estres cognitivo

## 2. Core Product Principles

Toda decision de producto debe reforzar:

- simplicidad
- claridad visual
- calma emocional
- transparencia
- bajo esfuerzo de uso
- orientacion humana

Si una propuesta aumenta carga cognitiva, ruido visual, ansiedad o complejidad sin claridad, debe simplificarse o descartarse.

## 3. UX and Visual Direction

La experiencia debe sentirse:

- limpia
- moderna
- confiable
- calmada
- liviana

Evitar:

- saturacion visual
- densidad excesiva de datos
- patrones agresivos o alarmistas
- jerarquia visual confusa

### 3.1 Visual Hierarchy Rules

- Los datos principales (balance, gasto total, disponible) deben ser visibles en menos de 5 segundos.
- La informacion secundaria no compite con los KPI principales.
- Priorizar resumen + expansion progresiva de detalle.
- Evitar tablas densas cuando una vista resumida cubre el objetivo.

### 3.2 Emotional UX Rules

- Nunca culpabilizar al usuario.
- Nunca usar lenguaje catastrofico para errores comunes.
- Mensajes de error: claros, neutrales y orientados a accion.

Ejemplo correcto:

> No se pudo guardar la transaccion. Intenta nuevamente.

Ejemplo incorrecto:

> Error financiero critico.

## 4. Feature Design Filter (Mandatory)

Antes de implementar una feature, validar:

1. Reduce friccion real?
2. Mejora claridad real?
3. Puede simplificarse mas?
4. Es necesaria para uso financiero cotidiano?
5. Si se elimina, mejora el foco del producto?

Si no supera este filtro, no se implementa.

## 5. Scope Boundaries

En foco:

- registro de ingresos y gastos
- categorizacion clara
- balance mensual
- seguimiento de cuotas activas
- metas de ahorro simples
- lectura rapida de situacion financiera

Fuera de foco:

- instrumentos financieros avanzados
- modelos impositivos complejos
- cumplimiento contable empresarial
- reporting institucional

## 6. Component and Interaction Philosophy

Todo componente debe priorizar:

- claridad sobre densidad
- legibilidad sobre compactacion
- consistencia sobre creatividad visual aislada

Preguntas obligatorias al disenar/intervenir UI:

1. Esto se entiende rapido?
2. Esto reduce friccion?
3. Esto mantiene un tono calmado?

## 7. Data Presentation Rules

Al presentar datos financieros:

- empezar por resumen
- revelar detalle bajo demanda
- evitar mostrar metricas avanzadas sin necesidad
- limitar el numero de indicadores simultaneos

El usuario debe entender rapidamente:

- cuanto tiene
- cuanto gasto
- cuanto queda
- que compromisos estan pendientes

## 8. Product Copy and Tone

El copy de UI debe ser:

- directo
- neutral
- profesional
- humano

Evitar:

- exageracion de marketing
- tono moralizante
- lenguaje sensacionalista
- emojis en copy de producto

## 9. Change Acceptance Criteria

Una entrega de producto/UX se considera aceptable cuando:

- respeta foco de claridad financiera
- no introduce complejidad innecesaria
- mantiene consistencia con flujos existentes
- conserva tono calmado en estados normales y de error
- no contradice `TecnicalAgents.md` ni `AGENTS.md` principal

## 10. Relationship With Technical Rules

- `AGENTS.md` define gobernanza general, skills, ramas, commits y PR.
- `TecnicalAgents.md` define arquitectura, capas y reglas tecnicas.
- Este documento define el que y el para que del producto.

Los tres son obligatorios.

## 11. Final Guiding Principle

Clocket debe sentirse como una herramienta que ordena, no que abruma.
Cada nueva decision debe aumentar claridad y reducir friccion.
