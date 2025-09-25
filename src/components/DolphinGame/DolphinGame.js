import React from 'react';
import styled from 'styled-components';

import { COLORS, UNIT } from '../../constants';

import BasicLayout from '../BasicLayout';
import MaxWidthWrapper from '../MaxWidthWrapper';
import Spacer from '../Spacer';
import Button from '../Button';

const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 540;

const KEY_BINDINGS = {
  arrowup: 'up',
  w: 'up',
  arrowdown: 'down',
  s: 'down',
  arrowleft: 'left',
  a: 'left',
  arrowright: 'right',
  d: 'right',
};

const updateGame = (game, delta, keys, ctx) => {
  const dolphin = game.dolphin;
  game.time += delta;
  game.waveOffset += delta * 120;
  const verticalIntent = (keys.up ? -1 : 0) + (keys.down ? 1 : 0);
  const horizontalIntent = (keys.left ? -1 : 0) + (keys.right ? 1 : 0);

  const verticalAcceleration = 620;
  const horizontalAcceleration = 380;

  dolphin.vy += verticalIntent * verticalAcceleration * delta;
  dolphin.vx += horizontalIntent * horizontalAcceleration * delta;

  dolphin.vy *= 0.94;
  dolphin.vx *= 0.9;

  dolphin.y += dolphin.vy * delta;
  dolphin.x += dolphin.vx * delta;

  const topBound = dolphin.radius + 24;
  const bottomBound = CANVAS_HEIGHT - dolphin.radius - 24;
  if (dolphin.y < topBound) {
    dolphin.y = topBound;
    if (dolphin.vy < 0) {
      dolphin.vy = 0;
    }
  }
  if (dolphin.y > bottomBound) {
    dolphin.y = bottomBound;
    if (dolphin.vy > 0) {
      dolphin.vy = 0;
    }
  }

  const leftBound = 90;
  const rightBound = CANVAS_WIDTH - 180;
  if (dolphin.x < leftBound) {
    dolphin.x = leftBound;
    dolphin.vx = 0;
  }
  if (dolphin.x > rightBound) {
    dolphin.x = rightBound;
    dolphin.vx = 0;
  }

  const baseSpeed = 220;
  const travelSpeed = baseSpeed + Math.min(260, game.distance * 1.4);
  game.distance += travelSpeed * delta * 0.09;
  game.health = Math.max(
    0,
    Math.min(
      100,
      game.health - delta * 3 + (verticalIntent !== 0 || horizontalIntent !== 0 ? delta * 1.2 : 0)
    )
  );
  game.immunityTimer = Math.max(0, game.immunityTimer - delta);
  game.sparkleTimer = Math.max(0, game.sparkleTimer - delta);

  // Spawn pearls or mines
  game.spawnClock += delta;
  if (game.spawnClock > 0.85) {
    game.spawnClock = 0;
    const spawnY = 120 + Math.random() * (CANVAS_HEIGHT - 240);
    if (Math.random() < 0.65) {
      game.pearls.push({
        x: CANVAS_WIDTH + 40,
        y: spawnY,
        radius: 14 + Math.random() * 6,
        drift: (Math.random() - 0.5) * 18,
      });
    } else {
      game.mines.push({
        x: CANVAS_WIDTH + 60,
        y: spawnY,
        radius: 26,
        rotation: Math.random() * Math.PI * 2,
        pulse: Math.random() * Math.PI * 2,
      });
    }
  }

  const pearls = [];
  game.pearls.forEach(pearl => {
    pearl.x -= travelSpeed * delta;
    pearl.y += Math.sin((game.time + pearl.x) * 0.012) * 18 * delta + pearl.drift * delta * 0.4;

    if (pearl.x < -40) {
      return;
    }

    const dx = pearl.x - dolphin.x;
    const dy = pearl.y - dolphin.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < pearl.radius + dolphin.radius * 0.6) {
      game.pearlsCollected += 1;
      game.health = Math.min(100, game.health + 14);
      game.sparkleTimer = 0.45;
      return;
    }

    pearls.push(pearl);
  });
  game.pearls = pearls;

  const mines = [];
  game.mines.forEach(mine => {
    mine.x -= travelSpeed * delta * 0.95;
    mine.rotation += delta * 1.2;
    mine.pulse += delta * 4;

    if (mine.x < -60) {
      return;
    }

    const dx = mine.x - (dolphin.x + dolphin.radius * 0.4);
    const dy = mine.y - dolphin.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (game.immunityTimer <= 0 && distance < mine.radius + dolphin.radius * 0.55) {
      game.health -= 32;
      game.immunityTimer = 1.4;
      return;
    }

    mines.push(mine);
  });
  game.mines = mines;

  game.bubbleClock += delta;
  if (game.bubbleClock > 0.12) {
    game.bubbleClock = 0;
    game.bubbles.push({
      x: dolphin.x - dolphin.radius * 1.6,
      y: dolphin.y + Math.sin(game.time * 8) * 12 + (Math.random() - 0.5) * 18,
      radius: 4 + Math.random() * 3,
      alpha: 0.9,
    });
  }

  const bubbles = [];
  game.bubbles.forEach(bubble => {
    bubble.x -= travelSpeed * delta * 0.6;
    bubble.y -= delta * 10;
    bubble.alpha -= delta * 0.6;
    bubble.radius += delta * 6;

    if (bubble.alpha <= 0) {
      return;
    }

    bubbles.push(bubble);
  });
  game.bubbles = bubbles;

  game.score =
    game.distance * 14 + game.pearlsCollected * 220 + Math.max(0, game.health) * 3 + (game.immunityTimer > 0 ? 25 : 0);

  drawScene(ctx, game);

  const summary = {
    score: Math.round(game.score),
    pearls: game.pearlsCollected,
    distance: Math.round(game.distance),
    health: Math.max(0, Math.round(game.health)),
    gameOver: game.health <= 0,
  };

  return summary;
};

const drawScene = (ctx, game) => {
  const { dolphin } = game;
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  const background = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  background.addColorStop(0, '#001428');
  background.addColorStop(0.45, '#023053');
  background.addColorStop(1, '#01405c');
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  drawLightBeams(ctx, game.time);
  drawWaves(ctx, game.waveOffset);
  drawPearls(ctx, game.pearls);
  drawMines(ctx, game.mines, game.time);
  drawBubbles(ctx, game.bubbles);
  drawDolphin(ctx, dolphin, game.sparkleTimer, game.immunityTimer);
  drawForegroundGlints(ctx, game.time);
};

const drawLightBeams = (ctx, time) => {
  ctx.save();
  ctx.globalAlpha = 0.18;
  for (let i = 0; i < 3; i++) {
    const offset = ((i * 260 + time * 45) % (CANVAS_WIDTH + 220)) - 220;
    const gradient = ctx.createLinearGradient(offset, 0, offset + 220, CANVAS_HEIGHT);
    gradient.addColorStop(0, 'rgba(255,255,255,0)');
    gradient.addColorStop(0.5, 'rgba(255,255,255,0.4)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(offset, 0);
    ctx.lineTo(offset + 220, 0);
    ctx.lineTo(offset + 120, CANVAS_HEIGHT);
    ctx.lineTo(offset - 80, CANVAS_HEIGHT);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
};

const drawWaves = (ctx, offset) => {
  const layers = [
    {
      color: 'rgba(2, 40, 70, 0.55)',
      amplitude: 18,
      baseline: CANVAS_HEIGHT * 0.75,
      frequency: 0.012,
      speed: 1.2,
    },
    {
      color: 'rgba(3, 55, 92, 0.45)',
      amplitude: 28,
      baseline: CANVAS_HEIGHT * 0.82,
      frequency: 0.01,
      speed: 0.8,
    },
    {
      color: 'rgba(6, 72, 110, 0.35)',
      amplitude: 36,
      baseline: CANVAS_HEIGHT * 0.9,
      frequency: 0.009,
      speed: 0.6,
    },
  ];

  layers.forEach((layer, index) => {
    ctx.beginPath();
    ctx.moveTo(0, CANVAS_HEIGHT);
    for (let x = 0; x <= CANVAS_WIDTH; x += 12) {
      const angle = (x + offset * layer.speed + index * 120) * layer.frequency;
      const y = layer.baseline + Math.sin(angle) * layer.amplitude;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.closePath();
    ctx.fillStyle = layer.color;
    ctx.fill();
  });
};

const drawPearls = (ctx, pearls) => {
  ctx.save();
  pearls.forEach(pearl => {
    const gradient = ctx.createRadialGradient(
      pearl.x - pearl.radius * 0.4,
      pearl.y - pearl.radius * 0.4,
      pearl.radius * 0.2,
      pearl.x,
      pearl.y,
      pearl.radius
    );
    gradient.addColorStop(0, 'rgba(255,255,255,0.95)');
    gradient.addColorStop(0.6, 'rgba(156, 235, 255, 0.8)');
    gradient.addColorStop(1, 'rgba(146, 210, 255, 0.15)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(pearl.x, pearl.y, pearl.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();
  });
  ctx.restore();
};

const drawMines = (ctx, mines, time) => {
  ctx.save();
  mines.forEach(mine => {
    ctx.save();
    ctx.translate(mine.x, mine.y);
    ctx.rotate(mine.rotation);
    const pulse = (Math.sin(mine.pulse + time) + 1) / 2;

    ctx.fillStyle = `rgba(15, 35, 58, ${0.55 + pulse * 0.25})`;
    for (let i = 0; i < 8; i++) {
      ctx.rotate(Math.PI / 4);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(mine.radius + 10, 4);
      ctx.lineTo(mine.radius - 6, -4);
      ctx.closePath();
      ctx.fill();
    }

    const coreGradient = ctx.createRadialGradient(0, 0, mine.radius * 0.3, 0, 0, mine.radius);
    coreGradient.addColorStop(0, 'rgba(70, 120, 180, 0.9)');
    coreGradient.addColorStop(1, 'rgba(8, 18, 35, 0.95)');

    ctx.beginPath();
    ctx.fillStyle = coreGradient;
    ctx.arc(0, 0, mine.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.fillStyle = `rgba(255, 60, 60, ${0.25 + pulse * 0.45})`;
    ctx.arc(0, 0, mine.radius * 0.35, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  });
  ctx.restore();
};

const drawBubbles = (ctx, bubbles) => {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  bubbles.forEach(bubble => {
    ctx.beginPath();
    ctx.fillStyle = `rgba(180, 240, 255, ${bubble.alpha})`;
    ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
};

const drawDolphin = (ctx, dolphin, sparkleTimer, immunityTimer) => {
  const tailWave = Math.sin(dolphin.y * 0.04 + sparkleTimer * 6) * dolphin.radius * 0.5;
  const bodyGradient = ctx.createLinearGradient(
    dolphin.x - dolphin.radius * 2.1,
    dolphin.y - dolphin.radius,
    dolphin.x + dolphin.radius * 1.8,
    dolphin.y + dolphin.radius
  );
  bodyGradient.addColorStop(0, '#0c76d1');
  bodyGradient.addColorStop(0.4, '#1fc4ff');
  bodyGradient.addColorStop(1, '#a5efff');

  ctx.save();

  ctx.beginPath();
  ctx.moveTo(dolphin.x - dolphin.radius * 1.6, dolphin.y);
  ctx.quadraticCurveTo(
    dolphin.x - dolphin.radius * 2.6,
    dolphin.y - dolphin.radius * 1.2,
    dolphin.x - dolphin.radius * 3,
    dolphin.y - tailWave
  );
  ctx.quadraticCurveTo(
    dolphin.x - dolphin.radius * 2.4,
    dolphin.y,
    dolphin.x - dolphin.radius * 3,
    dolphin.y + tailWave
  );
  ctx.quadraticCurveTo(
    dolphin.x - dolphin.radius * 2.6,
    dolphin.y + dolphin.radius * 1.2,
    dolphin.x - dolphin.radius * 1.6,
    dolphin.y
  );
  ctx.fillStyle = bodyGradient;
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(
    dolphin.x,
    dolphin.y,
    dolphin.radius * 1.7,
    dolphin.radius * 1.05,
    0,
    0,
    Math.PI * 2
  );
  ctx.fillStyle = bodyGradient;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(dolphin.x - dolphin.radius * 0.4, dolphin.y - dolphin.radius * 0.5);
  ctx.quadraticCurveTo(
    dolphin.x + dolphin.radius * 0.1,
    dolphin.y - dolphin.radius * 1.1,
    dolphin.x + dolphin.radius * 0.7,
    dolphin.y - dolphin.radius * 0.4
  );
  ctx.lineTo(dolphin.x - dolphin.radius * 0.2, dolphin.y - dolphin.radius * 0.1);
  ctx.closePath();
  ctx.fillStyle = '#0ea2ff';
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(dolphin.x - dolphin.radius * 0.4, dolphin.y + dolphin.radius * 0.1);
  ctx.quadraticCurveTo(
    dolphin.x + dolphin.radius * 0.8,
    dolphin.y + dolphin.radius * 0.6,
    dolphin.x + dolphin.radius * 0.2,
    dolphin.y + dolphin.radius * 0.9
  );
  ctx.lineTo(dolphin.x - dolphin.radius * 0.3, dolphin.y + dolphin.radius * 0.3);
  ctx.closePath();
  ctx.fillStyle = '#0f8fe0';
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(dolphin.x + dolphin.radius * 1.4, dolphin.y - dolphin.radius * 0.1);
  ctx.quadraticCurveTo(
    dolphin.x + dolphin.radius * 1.95,
    dolphin.y - dolphin.radius * 0.4,
    dolphin.x + dolphin.radius * 2,
    dolphin.y + dolphin.radius * 0.1
  );
  ctx.quadraticCurveTo(
    dolphin.x + dolphin.radius * 1.85,
    dolphin.y + dolphin.radius * 0.5,
    dolphin.x + dolphin.radius * 1.2,
    dolphin.y + dolphin.radius * 0.3
  );
  ctx.fillStyle = '#c6f6ff';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(dolphin.x + dolphin.radius * 0.7, dolphin.y - dolphin.radius * 0.2, dolphin.radius * 0.18, 0, Math.PI * 2);
  ctx.fillStyle = '#05264b';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(dolphin.x + dolphin.radius * 0.78, dolphin.y - dolphin.radius * 0.28, dolphin.radius * 0.08, 0, Math.PI * 2);
  ctx.fillStyle = 'white';
  ctx.fill();

  if (sparkleTimer > 0) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, sparkleTimer * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(
      dolphin.x,
      dolphin.y,
      dolphin.radius * 1.9,
      dolphin.radius * 1.2,
      0,
      0,
      Math.PI * 2
    );
    ctx.stroke();
    ctx.restore();
  }

  if (immunityTimer > 0) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = Math.min(0.6, immunityTimer);
    ctx.beginPath();
    ctx.fillStyle = 'rgba(100, 220, 255, 0.35)';
    ctx.arc(dolphin.x, dolphin.y, dolphin.radius * 1.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
};

const drawForegroundGlints = (ctx, time) => {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = 0.18;
  for (let i = 0; i < 30; i++) {
    const x = (i * 37 + time * 45) % (CANVAS_WIDTH + 80) - 40;
    const y = (Math.sin(time * 0.6 + i * 1.7) * 0.5 + 0.5) * CANVAS_HEIGHT;
    ctx.beginPath();
    ctx.fillStyle = 'rgba(120, 210, 255, 0.5)';
    ctx.arc(x, y, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
};

const DolphinGame = () => {
  const canvasRef = React.useRef(null);
  const animationRef = React.useRef(null);
  const lastFrameRef = React.useRef(null);
  const keysRef = React.useRef({ up: false, down: false, left: false, right: false });
  const gameRef = React.useRef(null);

  const [hud, setHud] = React.useState({
    status: 'intro',
    score: 0,
    pearls: 0,
    distance: 0,
    health: 100,
    bestScore: 0,
  });

  React.useEffect(() => {
    const handleKeyDown = event => {
      const tag = event.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') {
        return;
      }

      const intent = KEY_BINDINGS[event.key.toLowerCase()];
      if (intent) {
        event.preventDefault();
        keysRef.current[intent] = true;
      }
    };

    const handleKeyUp = event => {
      const intent = KEY_BINDINGS[event.key.toLowerCase()];
      if (intent) {
        keysRef.current[intent] = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const startGame = React.useCallback(() => {
    const context = canvasRef.current?.getContext('2d');
    if (!context) {
      return;
    }

    gameRef.current = {
      dolphin: {
        x: CANVAS_WIDTH * 0.3,
        y: CANVAS_HEIGHT * 0.5,
        radius: 32,
        vx: 0,
        vy: 0,
      },
      pearls: [],
      mines: [],
      bubbles: [],
      time: 0,
      waveOffset: 0,
      pearlsCollected: 0,
      distance: 0,
      score: 0,
      health: 100,
      immunityTimer: 0,
      sparkleTimer: 0,
      spawnClock: 0,
      bubbleClock: 0,
    };

    lastFrameRef.current = null;

    setHud(prevHud => ({
      ...prevHud,
      status: 'running',
      score: 0,
      pearls: 0,
      distance: 0,
      health: 100,
    }));
  }, []);

  React.useEffect(() => {
    if (hud.status !== 'running') {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || !gameRef.current) {
      return;
    }

    const step = timestamp => {
      if (!lastFrameRef.current) {
        lastFrameRef.current = timestamp;
      }

      const delta = Math.min((timestamp - lastFrameRef.current) / 1000, 0.05);
      lastFrameRef.current = timestamp;

      const summary = updateGame(gameRef.current, delta, keysRef.current, ctx);

      setHud(prevHud => {
        if (prevHud.status !== 'running') {
          return prevHud;
        }

        if (
          prevHud.score === summary.score &&
          prevHud.pearls === summary.pearls &&
          prevHud.distance === summary.distance &&
          prevHud.health === summary.health
        ) {
          return prevHud;
        }

        return {
          ...prevHud,
          score: summary.score,
          pearls: summary.pearls,
          distance: summary.distance,
          health: summary.health,
        };
      });

      if (summary.gameOver) {
        setHud(prevHud => ({
          ...prevHud,
          status: 'game-over',
          score: summary.score,
          pearls: summary.pearls,
          distance: summary.distance,
          health: summary.health,
          bestScore: Math.max(prevHud.bestScore, summary.score),
        }));
        return;
      }

      animationRef.current = requestAnimationFrame(step);
    };

    animationRef.current = requestAnimationFrame(step);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [hud.status]);

  React.useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const healthPercent = Math.max(0, Math.min(100, hud.health));
  const isGameOver = hud.status === 'game-over';

  return (
    <BasicLayout>
      <GameWrapper>
        <MaxWidthWrapper maxWidth={1040}>
          <Heading>Midnight Tides: Dolphin's Encore</Heading>
          <Tagline>
            Captain Aurora, your star dolphin, is ready to chase luminous pearls through a living ocean scored by the
            Beatmapper soundtrack. Steer her gracefully, collect brilliance, and dodge the midnight mines to keep the
            music alive.
          </Tagline>

          <Spacer size={UNIT * 4} />

          <GameSurface>
            <StyledCanvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} />

            <Hud>
              <HudItem>
                <HudLabel>Score</HudLabel>
                <HudValue>{hud.score.toLocaleString()}</HudValue>
              </HudItem>
              <HudItem>
                <HudLabel>Pearls</HudLabel>
                <HudValue>{hud.pearls}</HudValue>
              </HudItem>
              <HudItem>
                <HudLabel>Distance</HudLabel>
                <HudValue>{hud.distance} m</HudValue>
              </HudItem>
              <HudItem $wide>
                <HudLabel>Spirit</HudLabel>
                <HealthBar>
                  <HealthFill style={{ width: `${healthPercent}%` }} />
                </HealthBar>
              </HudItem>
              <HudItem>
                <HudLabel>Best Score</HudLabel>
                <HudValue>{hud.bestScore.toLocaleString()}</HudValue>
              </HudItem>
            </Hud>

            {hud.status !== 'running' && (
              <Overlay>
                <OverlayCard>
                  <OverlayTitle>
                    {isGameOver ? 'A Legendary Run!' : 'Ready to Make Waves?'}
                  </OverlayTitle>
                  <OverlayParagraph>
                    Glide with the arrow keys or W/A/S/D. Pearls boost your spirit, mines will sap it, and the sea itself
                    hungers for momentum. Keep the rhythm, keep moving, and chain shimmering combos to chase the
                    leaderboard.
                  </OverlayParagraph>

                  {isGameOver && (
                    <OverlayParagraph>
                      You sailed for <strong>{hud.distance}m</strong>, gathered <strong>{hud.pearls}</strong> pearls, and
                      earned a score of <strong>{hud.score.toLocaleString()}</strong>. Can you outshine that encore?
                    </OverlayParagraph>
                  )}

                  <Button onClick={startGame}>
                    {isGameOver ? 'Swim Again' : 'Start Swimming'}
                  </Button>

                  <OverlayFooter>
                    Tip: Tap rhythmically between rises and dives to sling Aurora through the densest constellation of
                    pearls.
                  </OverlayFooter>
                </OverlayCard>
              </Overlay>
            )}
          </GameSurface>
        </MaxWidthWrapper>
      </GameWrapper>
    </BasicLayout>
  );
};

const GameWrapper = styled.div`
  padding-bottom: ${UNIT * 10}px;
`;

const Heading = styled.h1`
  font-size: 48px;
  color: ${COLORS.white};
  text-align: center;
  text-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
`;

const Tagline = styled.p`
  max-width: 760px;
  margin: 0 auto;
  font-size: 18px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.82);
  text-align: center;
`;

const GameSurface = styled.div`
  position: relative;
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 30px 70px rgba(0, 0, 0, 0.45);
`;

const StyledCanvas = styled.canvas`
  display: block;
  width: 100%;
  height: auto;
  background: linear-gradient(180deg, #001428 0%, #023053 45%, #01405c 100%);
`;

const Hud = styled.dl`
  position: absolute;
  top: ${UNIT * 2}px;
  left: ${UNIT * 2}px;
  right: ${UNIT * 2}px;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, auto));
  gap: ${UNIT * 2}px;
  margin: 0;
  padding: 0;
  list-style: none;

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, minmax(0, auto));
  }
`;

const HudItem = styled.div`
  min-width: 120px;
  padding: ${UNIT}px ${UNIT * 2}px;
  border-radius: 16px;
  background: rgba(2, 25, 45, 0.65);
  backdrop-filter: blur(6px);
  border: 1px solid rgba(255, 255, 255, 0.08);

  ${props =>
    props.$wide &&
    `
    grid-column: span 2;
    min-width: 180px;
  `}
`;

const HudLabel = styled.dt`
  margin: 0;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: rgba(255, 255, 255, 0.64);
`;

const HudValue = styled.dd`
  margin: 4px 0 0 0;
  font-size: 24px;
  font-weight: 600;
  color: ${COLORS.white};
`;

const HealthBar = styled.div`
  position: relative;
  height: 14px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
`;

const HealthFill = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  background: linear-gradient(90deg, #00d1ff 0%, #30ffa2 100%);
  transition: width 120ms ease-out;
`;

const Overlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 12, 25, 0.72);
  backdrop-filter: blur(6px);
  padding: ${UNIT * 4}px;
`;

const OverlayCard = styled.div`
  max-width: 520px;
  background: rgba(2, 32, 58, 0.85);
  padding: ${UNIT * 4}px;
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.45);
  text-align: center;
  color: ${COLORS.white};
  border: 1px solid rgba(255, 255, 255, 0.12);

  & > button {
    margin-top: ${UNIT * 3}px;
  }
`;

const OverlayTitle = styled.h2`
  margin: 0 0 ${UNIT * 2}px 0;
  font-size: 32px;
`;

const OverlayParagraph = styled.p`
  margin: 0 0 ${UNIT * 2}px 0;
  font-size: 16px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.85);

  strong {
    color: ${COLORS.white};
  }
`;

const OverlayFooter = styled.p`
  margin-top: ${UNIT * 3}px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
`;

export default DolphinGame;
