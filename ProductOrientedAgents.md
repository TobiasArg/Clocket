# Agents – Product & Brand Rules (Clocket)

This document defines the **product, brand, and experience rules** for Clocket.  
It must be used together with the technical `Agents.md`.

If a change complies technically but violates this document, it is **not acceptable**.

---

# 1. Product Identity

Clocket is a personal finance clarity application.

Clocket is not:

- An accounting system
- A corporate financial platform
- A banking replacement
- A complex financial analytics tool

Clocket is:

- A clarity tool
- A daily money awareness interface
- A clean financial overview system

Clocket connects:

- Time (Clock)
- Personal money (Pocket)

Every expense represents life energy.  
Every financial decision represents time allocation.

The product must always reinforce that philosophy.

---

# 2. Core Product Principles

All features must reinforce these values:

- Simplicity
- Visual clarity
- Emotional calm
- Transparency
- Low friction
- Human-centered design

If a feature increases:

- Cognitive load
- Visual noise
- Anxiety
- Excessive control mechanisms
- Complexity without clarity

It must be rejected or simplified.

---

# 3. Design & UX Rules

Clocket must feel:

- Minimal
- Professional
- Modern
- Calm
- Clean
- Trustworthy
- Light

Never:

- Overloaded
- Aggressive
- Alarmist
- Visually saturated
- Data-dense without hierarchy

---

## 3.1 Visual Hierarchy

- Important numbers must stand out clearly.
- Secondary information must not compete visually.
- Avoid excessive badges.
- Avoid unnecessary color variety.
- Avoid aggressive red tones unless strictly required.
- Avoid dense tables when a summarized view works better.

Clocket is not a spreadsheet.

---

## 3.2 Emotional UX

Clocket does not:

- Shame the user
- Alarm excessively
- Use dramatic warnings
- Create urgency pressure

Error states must be calm and neutral.

Correct:

> We couldn’t save this transaction. Please try again.

Incorrect:

> Critical financial error!

---

# 4. Feature Design Filter (Mandatory)

Before implementing any new feature, ask:

1. Does this reduce friction?
2. Does this improve clarity?
3. Can this be simplified further?
4. Is this necessary for everyday financial awareness?
5. Would removing it improve focus?

If the feature cannot clearly justify its existence, it should not be built.

---

# 5. Product Scope Boundaries

Clocket focuses on:

- Income registration
- Expense tracking
- Clear categorization
- Monthly balance visualization
- Active installments (cuotas)
- Simple goal tracking
- Basic financial awareness

Clocket does not focus on:

- Advanced financial instruments
- Complex tax systems
- Accounting compliance
- Enterprise financial reporting
- Institutional analytics

---

# 6. UI Component Philosophy

Reusable components must:

- Be clean and neutral
- Avoid visual clutter
- Prefer whitespace over density
- Prefer clarity over compactness
- Prefer readable typography over compressed layouts

Every component must answer:

> Does this feel calm?

---

# 7. Data Presentation Rules

When presenting financial data:

- Prioritize summary over detail.
- Detail should be expandable, not default.
- Avoid showing too many metrics at once.
- Avoid advanced ratios unless essential.
- Balance must be understandable in under 5 seconds.

The user should open Clocket and quickly understand:

- How much they have
- How much they spent
- What remains
- What is pending

---

# 8. Tone of Communication

All UI copy must be:

- Direct
- Calm
- Professional
- Neutral
- Human

Avoid:

- Marketing exaggeration
- Emojis in product UI
- Sensational language
- Judgmental tone

Clocket does not shout.  
Clocket organizes.

Clocket does not judge.  
Clocket shows.

Clocket does not complicate.  
Clocket simplifies.

---

# 9. Future Feature Discipline

Clocket must avoid feature creep.

Before expanding functionality:

- Confirm it aligns with clarity.
- Confirm it reduces friction.
- Confirm it keeps the product light.
- Confirm it serves the target audience (20–40 digital professionals).

More features do not equal better product.  
Better clarity equals better product.

---

# 10. Relationship Between Technical and Product Rules

The technical `Agents.md` defines:

- Folder structure
- Export rules
- Architecture constraints
- Import policies
- Styling restrictions

This file defines:

- What should be built
- Why it should be built
- How it should feel
- What must not be built

Both documents are mandatory.

Technical compliance without product coherence is invalid.  
Product alignment without technical compliance is invalid.

---

# 11. Final Guiding Principle

Clocket should feel like:

A clean space where the user enters,  
understands their financial situation,  
and leaves with mental clarity.

If the implementation does not create clarity,  
it is not Clocket.
