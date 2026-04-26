import matplotlib.pyplot as plt
import numpy as np

def generate_latency_chart():
    """
    Generates a high-quality PDF bar chart comparing CPU and GPU latency.
    This script is designed to produce an IEEE publication-ready graph.
    """
    # 1. Setup the data (Replace these with your actual backend results)
    hardware_platforms = ['CPU\n(Multi-core)', 'GPU\n(cuDNN + CUDA)']
    latency_means = [185.4, 12.2] # The average latency in milliseconds
    latency_stdev = [15.3, 0.8]   # The standard deviation in milliseconds

    # 2. Configure the plot style for academic aesthetics
    plt.style.use('seaborn-v0_8-whitegrid')
    fig, ax = plt.subplots(figsize=(7, 5))

    # 3. Create the bar chart
    # We use distinct but professional colors: a soft red for CPU (slow), green for GPU (fast)
    colors = ['#d62728', '#2ca02c']
    bars = ax.bar(hardware_platforms, latency_means, 
                  yerr=latency_stdev, capsize=8, 
                  color=colors, edgecolor='black', linewidth=1.2, 
                  alpha=0.85, width=0.6)

    # 4. Add numerical labels on top of the bars for exact clarity
    for bar in bars:
        height = bar.get_height()
        ax.annotate(f'{height:.1f} ms',
                    xy=(bar.get_x() + bar.get_width() / 2, height),
                    xytext=(0, 5),  # 5 points vertical offset
                    textcoords="offset points",
                    ha='center', va='bottom',
                    fontweight='bold', fontsize=11)

    # 5. Format axes and titles
    ax.set_ylabel('Inference Latency (ms)', fontweight='bold', fontsize=12)
    ax.set_title('ResNet-50 Inference Performance: CPU vs. GPU', 
                 fontweight='bold', fontsize=14, pad=15)
    
    # Ensure the y-axis has enough headroom for the labels
    ax.set_ylim(0, max(latency_means) * 1.25)
    
    # Increase font sizes for readability in a printed paper
    ax.tick_params(axis='both', which='major', labelsize=11)

    # 6. Save the figure as a high-resolution PDF and PNG
    plt.tight_layout()
    plt.savefig('DeepAccel_Latency_Chart.pdf', format='pdf', dpi=300)
    plt.savefig('DeepAccel_Latency_Chart.png', format='png', dpi=300)
    
    print("Successfully generated 'DeepAccel_Latency_Chart.pdf' and '.png'")

if __name__ == "__main__":
    generate_latency_chart()
