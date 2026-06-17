#!/usr/bin/env python3
"""Benchmark N+1 vs batched product summary fetch."""

from __future__ import annotations

import argparse
import cProfile
import io
import pstats
import sqlite3
import statistics
import sys
import time
from pathlib import Path

from store import PRODUCT_COUNT, fetch_summaries_batched, fetch_summaries_n_plus_one, init_db

ITERATIONS = 5


def _timed_ms(fn, conn) -> float:
    start = time.perf_counter()
    fn(conn)
    return (time.perf_counter() - start) * 1000


def run_benchmark(mode: str) -> dict:
    conn = sqlite3.connect(":memory:")
    conn.row_factory = sqlite3.Row
    init_db(conn)

    baseline_ms = None
    after_ms = None

    if mode in ("baseline", "both"):
        samples = [_timed_ms(fetch_summaries_n_plus_one, conn) for _ in range(ITERATIONS)]
        baseline_ms = statistics.mean(samples)

    if mode in ("after", "both"):
        samples = [_timed_ms(fetch_summaries_batched, conn) for _ in range(ITERATIONS)]
        after_ms = statistics.mean(samples)

    conn.close()

    improvement_pct = None
    if baseline_ms is not None and after_ms is not None and baseline_ms > 0:
        improvement_pct = ((baseline_ms - after_ms) / baseline_ms) * 100

    return {
        "mode": mode,
        "baseline_ms": baseline_ms,
        "after_ms": after_ms,
        "improvement_pct": improvement_pct,
        "product_count": PRODUCT_COUNT,
        "iterations": ITERATIONS,
    }


def run_profile() -> str:
    conn = sqlite3.connect(":memory:")
    conn.row_factory = sqlite3.Row
    init_db(conn)

    profiler = cProfile.Profile()
    profiler.enable()
    fetch_summaries_n_plus_one(conn)
    profiler.disable()
    conn.close()

    stream = io.StringIO()
    stats = pstats.Stats(profiler, stream=stream)
    stats.sort_stats("cumulative")
    stats.print_stats(12)
    return stream.getvalue()


def format_result(result: dict) -> str:
    lines = [
        "A6 profile-target benchmark",
        f"mode={result['mode']}",
        f"products={result['product_count']}",
        f"iterations={result['iterations']}",
    ]
    if result["baseline_ms"] is not None:
        lines.append(f"baseline_mean_ms={result['baseline_ms']:.2f}")
    if result["after_ms"] is not None:
        lines.append(f"after_mean_ms={result['after_ms']:.2f}")
    if result["improvement_pct"] is not None:
        lines.append(f"improvement_pct={result['improvement_pct']:.1f}")
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--mode",
        choices=["baseline", "after", "both", "profile"],
        default="both",
    )
    args = parser.parse_args()

    if args.mode == "profile":
        print(run_profile())
        return 0

    result = run_benchmark(args.mode)
    print(format_result(result))
    return 0


if __name__ == "__main__":
    sys.exit(main())
