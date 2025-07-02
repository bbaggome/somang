

namespace MockUpUser
{
    public partial class MainPage : ContentPage
    {
        public MainPage()
        {
            InitializeComponent();
            LoadHtml("login.html");

            HtmlWebView.Navigating += (s, e) =>
            {
                if (e.Url.EndsWith(".html"))
                {
                    e.Cancel = true;
                    var localFile = e.Url.Substring(e.Url.LastIndexOf('/') + 1);
                    LoadHtml(localFile);
                }
            };
        }

        protected override bool OnBackButtonPressed()
        {
            if (HtmlWebView.CanGoBack)
            {
                HtmlWebView.GoBack();
                return true; // 우리가 처리함
            }

            return base.OnBackButtonPressed();
        }

        private void LoadHtml(string fileName)
        {
            var path = $"MockUpUser.Resources.Raw.{fileName.Replace("/", ".")}";
            var assembly = typeof(MainPage).Assembly;

            foreach (var res in assembly.GetManifestResourceNames())
            {
                System.Diagnostics.Debug.WriteLine($"[RESOURCE] {res}");
            }

            using var stream = assembly.GetManifestResourceStream(path);
            using var reader = new StreamReader(stream);
            var html = reader.ReadToEnd();

            HtmlWebView.Source = new HtmlWebViewSource
            {
                Html = html,
            };
        }
    }
}
